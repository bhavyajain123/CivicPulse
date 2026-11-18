const activeConnections = new Map<string, Set<string>>();

export const presenceService = {
  connect(userId: string, socketId: string): void {
    const connections =
      activeConnections.get(userId) ?? new Set<string>();
    connections.add(socketId);
    activeConnections.set(userId, connections);
  },

  disconnect(userId: string, socketId: string): boolean {
    const connections = activeConnections.get(userId);
    if (!connections) {
      return false;
    }
    connections.delete(socketId);

    if (connections.size === 0) {
      activeConnections.delete(userId);
      return true;
    }

    return false;
  },

  isOnline(userId: string): boolean {
    return (activeConnections.get(userId)?.size ?? 0) > 0;
  },

  online(userIds: string[]): string[] {
    return userIds.filter(userId => this.isOnline(userId));
  },

  getOnlineCount(): number {
    return activeConnections.size;
  }
};