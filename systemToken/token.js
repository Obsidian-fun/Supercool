import {execSync} from 'child_process';

export function uuid() {
  let id = execSync("uuidgen;",{encoding: 'UTF-8'}).trim();
  return id;
}

export function cryptToken() {
  let token = execSync("tr -cd '[:alnum:]' < /dev/urandom | head -c 36", {encoding: 'UTF-8'});
  return token;
}


