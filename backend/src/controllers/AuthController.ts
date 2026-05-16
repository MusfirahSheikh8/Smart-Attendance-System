import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { success, badRequest, serverError } from '../utils/response';
import { LoginRequest } from '../types';

export class AuthController {

  static async login(req: Request<{}, {}, LoginRequest>, res: Response) {
    try {
      // console.log(req.body);
      const { username, password } = req.body;

      const result = await AuthService.login({ username, password });

      return success(res, result, 'Login successful');
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return badRequest(res, error.message);
      }
      return serverError(res, error.message);
    }
  }

  static async me(req: Request, res: Response) {
    // req.user is set by the authenticate middleware
    return success(res, req.user, 'Profile retrieved');
  }
}
