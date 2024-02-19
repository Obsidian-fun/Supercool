
// This was taken from the example provided by the official socket.io library documentation, to implement session management in sockets. For reference, you can check out the code at,
// https://socket.io/get-started/private-messaging-part-2


class SessionStore(){
  findSession(id);
  saveSession(id, session);
  findAllSessions() {}
}

class InMemorySessionStore extends SessionStore {
  constructor() {
    super();
    this.sessions = new Map();
  }

  findSession(id){
    return this.sessions.get(id);
  }

  saveSession(id, session){
    this.sessions.set(id, session);
  }

  findAllSessions(){
    return [...this.sessions.values()];
  }
}

const socket = new SessionStore();




