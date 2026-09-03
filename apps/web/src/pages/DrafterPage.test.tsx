import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/Toast';
import { DrafterPage } from './DrafterPage';

vi.mock('@/lib/api', () => ({ createDispute: vi.fn().mockResolvedValue({ id: 'd1' }) }));
vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));

import { createDispute } from '@/lib/api';
import { track } from '@/lib/analytics';

function renderDrafter() {
  return render(
    <MemoryRouter initialEntries={['/dispute/new']}>
      <ToastProvider>
        <DrafterPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('DrafterPage', () => {
  it('walks a challan through all three steps into a personalized letter', async () => {
    const user = userEvent.setup();
    renderDrafter();

    expect(track).toHaveBeenCalledWith('drafter_opened');

    // Step 1
    await user.type(screen.getByLabelText(/vehicle number/i), 'DL3CAB1234');
    await user.type(screen.getByLabelText(/fine amount/i), '2000');
    await user.type(screen.getByLabelText(/challan date/i), '2026-07-15');
    await user.type(screen.getByLabelText(/^offence/i), 'Overspeeding');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 — pick a ground
    await user.click(screen.getByText(/not my vehicle/i));
    await user.click(screen.getByRole('button', { name: /generate letter/i }));

    // Step 3 — the letter
    const letter = await screen.findByDisplayValue(/registered owner of vehicle DL3CAB1234/i);
    expect(letter).toBeInTheDocument();
    expect((letter as HTMLTextAreaElement).value).toContain('Overspeeding');
    expect((letter as HTMLTextAreaElement).value).toContain('₹2,000');
    expect(track).toHaveBeenCalledWith('dispute_drafted', { ground: 'wrongvehicle' });

    // Save
    await user.click(screen.getByRole('button', { name: /save & track/i }));
    await waitFor(() => expect(createDispute).toHaveBeenCalledTimes(1));
    expect(track).toHaveBeenCalledWith('dispute_saved', { ground: 'wrongvehicle' });
  });

  it('blocks step 1 when required fields are missing', async () => {
    const user = userEvent.setup();
    renderDrafter();
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(
      screen.getByText(/enter a valid registration number/i),
    ).toBeInTheDocument();
    // still on step 1
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });
});
