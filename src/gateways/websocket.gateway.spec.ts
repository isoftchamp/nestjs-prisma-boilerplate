import { INestApplication, Provider } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Test } from '@nestjs/testing';
import { Socket, io } from 'socket.io-client';

import { CoreModule } from '../core/core.module.js';
import { SocketAuthMiddleware } from '../shared/middlewares/index.js';
import { AuthModule } from '../web/features/auth/auth.module.js';
import { WebsocketGateway } from './websocket.gateway.js';

const mockSocketAuthMiddleware = {
  use: vi.fn((socket, next) => {
    // Mock successful authentication and attach a mock user
    socket.user = { id: '123', email: 'test@example.com' };
    next();
  }),
};

async function createNestApp(...gateways: Provider[]): Promise<INestApplication> {
  const testingModule = await Test.createTestingModule({
    imports: [CoreModule, AuthModule],
    providers: [
      ...gateways,
      {
        provide: SocketAuthMiddleware,
        useValue: mockSocketAuthMiddleware, // Use the mocked middleware
      },
    ],
  }).compile();
  return testingModule.createNestApplication();
}

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let app: INestApplication;
  let ioClient: Socket;

  beforeAll(async () => {
    // Instantiate the app
    app = await createNestApp(WebsocketGateway);
    app.useWebSocketAdapter(new IoAdapter(app));
    // Get the gateway instance from the app instance
    gateway = app.get<WebsocketGateway>(WebsocketGateway);
    await app.listen(0);

    // Create a new client that will interact with the gateway
    ioClient = io(await app.getUrl(), {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should emit "pong" on "ping"', async () => {
    ioClient.connect();
    ioClient.emit('ping', 'Hello world!');
    await new Promise<void>((resolve) => {
      ioClient.on('pong', (data) => {
        expect(data).toBe('Hello world!');
        resolve();
      });
    });
    ioClient.disconnect();
  });
});
