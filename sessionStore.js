
// This was taken from the example provided by the official socket.io library documentation, to implement session management in sockets. For reference, you can check out the code at,
// https://socket.io/get-started/private-messaging-part-2

import HashMap from 'hashmap';


export class SessionStore{
  findSession(id) {}
  saveSession(id, session) {}
  findAllSessions() {}
}

export class InMemorySessionStore extends SessionStore {
  constructor() {
    super();
    this.sessions = new HashMap();
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



