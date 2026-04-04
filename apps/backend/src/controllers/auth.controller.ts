import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { RegisterInput, LoginInput } from '@video-streamer/shared';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body as RegisterInput;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'editor',
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to login',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch user',
        timestamp: new Date().toISOString(),
      },
    });
  }
};
