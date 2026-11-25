import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ApiMyResponse(options: { [key in string]: any } = { status: 200 }) {
  if (!options.description) {
    switch (options.status) {
      case 200:
        options.description = 'OK';
        break;
      case 201:
        options.description = 'Created data';
        break;
      case 400:
        options.description = 'Bad request';
        break;
      case 401:
        options.description = 'Unauthorized';
        break;
      case 404:
        options.description = 'Not found';
        break;
      case 500:
        options.description = 'Internal server error';
        break;
    }
  }

  return applyDecorators(ApiResponse(options));
}
