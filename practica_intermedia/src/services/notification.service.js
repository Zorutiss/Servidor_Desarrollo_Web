import { EventEmitter } from 'events';

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this._registerListeners();
  }

  _registerListeners() {
    this.on('user:registered', (user) => {
      console.log(`[EVENT] user:registered — ${user.email} (código: ${user.verificationCode})`);
    });

    this.on('user:verified', (user) => {
      console.log(`[EVENT] user:verified — ${user.email} verificado correctamente`);
    });

    this.on('user:invited', (data) => {
      console.log(`[EVENT] user:invited — ${data.invitedEmail} invitado por ${data.invitedBy}`);
    });

    this.on('user:deleted', (user) => {
      console.log(`[EVENT] user:deleted — ${user.email} eliminado`);
    });
  }
}

export const notificationService = new NotificationService();
