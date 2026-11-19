import { type User } from '@prisma/client';
import { Socket as IOSocket } from 'socket.io';

export class Socket extends IOSocket {
  user?: User;
  roomType?: string;
  roomId?: string;
  room?: string;
}
