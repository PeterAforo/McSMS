import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state after reset', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should have login function', () => {
      const { login } = useAuthStore.getState();
      expect(typeof login).toBe('function');
    });

    it('should have logout function', () => {
      const { logout } = useAuthStore.getState();
      expect(typeof logout).toBe('function');
    });

    it('should have updateUser function', () => {
      const { updateUser } = useAuthStore.getState();
      expect(typeof updateUser).toBe('function');
    });
  });

  describe('login', () => {
    it('should set user and token on login', () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@test.com', user_type: 'admin' };
      const mockToken = 'mock-token-123';

      const { login } = useAuthStore.getState();
      login(mockUser, mockToken);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should call localStorage.setItem on login', () => {
      const mockUser = { id: 1, name: 'Test User' };
      const mockToken = 'token-123';

      const { login } = useAuthStore.getState();
      login(mockUser, mockToken);

      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
    });
  });

  describe('logout', () => {
    it('should clear user state on logout', () => {
      // First set up a logged in state
      useAuthStore.setState({
        user: { id: 1, name: 'Test' },
        token: 'token123',
        isAuthenticated: true,
      });

      const { logout } = useAuthStore.getState();
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should call localStorage.removeItem on logout', () => {
      const { logout } = useAuthStore.getState();
      logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      useAuthStore.setState({
        user: { id: 1, name: 'Old Name' },
        token: 'token',
        isAuthenticated: true,
      });

      const { updateUser } = useAuthStore.getState();
      updateUser({ id: 1, name: 'New Name', email: 'new@email.com' });

      const state = useAuthStore.getState();
      expect(state.user.name).toBe('New Name');
      expect(state.user.email).toBe('new@email.com');
    });

    it('should call localStorage.setItem on updateUser', () => {
      const { updateUser } = useAuthStore.getState();
      const updatedUser = { id: 1, name: 'Updated User' };
      updateUser(updatedUser);

      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
    });
  });
});
