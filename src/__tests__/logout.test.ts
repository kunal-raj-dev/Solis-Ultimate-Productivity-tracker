import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';

describe('Solis Authentication Logout Flow & State Isolation', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('successfully executes logout and terminates user session', async () => {
    // Initial login
    const session = await service.auth.login({
      email: 'scholar_a@solis.space',
      password: 'Password123!'
    });
    expect(session.user.email).toBe('scholar_a@solis.space');

    const currentUserBefore = await service.auth.getCurrentUser();
    expect(currentUserBefore).not.toBeNull();
    expect(currentUserBefore?.email).toBe('scholar_a@solis.space');

    // Execute logout
    await service.auth.logout();

    // Verify session terminated
    const currentUserAfter = await service.auth.getCurrentUser();
    expect(currentUserAfter).toBeNull();
  });

  it('notifies repository subscribers upon logout to clear downstream caches', async () => {
    let subscriberNotificationCount = 0;
    const unsubscribe = service.subscribe(() => {
      subscriberNotificationCount++;
    });

    await service.auth.login({
      email: 'scholar_a@solis.space',
      password: 'Password123!'
    });

    const countAfterLogin = subscriberNotificationCount;
    expect(countAfterLogin).toBeGreaterThan(0);

    // Logout triggers subscriber notification
    await service.auth.logout();
    expect(subscriberNotificationCount).toBeGreaterThan(countAfterLogin);

    unsubscribe();
  });

  it('guarantees clean state isolation when switching between User A and User B', async () => {
    // 1. User A logs in
    const sessionA = await service.auth.login({
      email: 'user_a@solis.space',
      password: 'PasswordA123'
    });
    expect(sessionA.user.email).toBe('user_a@solis.space');

    // 2. User A logs out
    await service.auth.logout();
    const intermediateUser = await service.auth.getCurrentUser();
    expect(intermediateUser).toBeNull();

    // 3. User B signs up / logs in
    const sessionB = await service.auth.signup({
      name: 'User Beta',
      email: 'user_b@solis.space',
      password: 'PasswordB123',
      focusField: 'Quantum Informatics'
    });

    expect(sessionB.user.email).toBe('user_b@solis.space');
    expect(sessionB.user.name).toBe('User Beta');
    expect(sessionB.user.focusField).toBe('Quantum Informatics');

    const currentUserB = await service.auth.getCurrentUser();
    expect(currentUserB?.email).toBe('user_b@solis.space');
    expect(currentUserB?.name).toBe('User Beta');
  });
});
