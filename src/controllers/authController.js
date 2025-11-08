const prisma = require('../lib/prisma');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update lastLogin timestamp
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: now }
    });

    // Prepare user data without password
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      chileanRutNumber: user.chileanRutNumber,
      color: user.color,
      lastLogin: now.toISOString(), // Use the updated timestamp
      createdAt: user.createdAt,
      createdBy: user.createdBy,
      roles: user.userRoles.map((ur) => ur.role.name)
    };

    // Generate JWT token
    const token = generateToken(userWithoutPassword);

    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    // User data is already available from the authentication middleware
    const user = req.user;

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user's own profile
// SECURITY: This endpoint only allows users to update their own profile.
// Role updates are explicitly prevented - even if roleIds are sent in the request,
// they will be ignored. Only admins can change roles via /admin/users/:id/roles
const updateProfile = async (req, res) => {
  try {
    const currentUser = req.user; // User from authentication middleware
    
    // Only extract allowed fields - roleIds and other admin-only fields are ignored
    const { username, email, name, lastName, chileanRutNumber, color } = req.body;

    // Ensure user can only update their own profile
    // No userId in params - user can only update themselves
    const userId = currentUser.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(username ? [{ username }] : []),
                ...(email ? [{ email }] : [])
              ]
            }
          ]
        }
      });

      if (duplicateUser) {
        res.status(409).json({ error: 'Username or email already exists' });
        return;
      }
    }

    // Explicitly exclude roleIds and any other admin-only fields from the update
    // Only allow updating: username, email, name, lastName, chileanRutNumber, color
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (chileanRutNumber !== undefined) updateData.chileanRutNumber = chileanRutNumber;
    if (color !== undefined) updateData.color = color;

    // Update user (roles are NOT updated - they can only be changed by admin)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const userWithoutPassword = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      lastName: updatedUser.lastName,
      chileanRutNumber: updatedUser.chileanRutNumber,
      color: updatedUser.color,
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt,
      createdBy: updatedUser.createdBy,
      roles: updatedUser.userRoles.map((ur) => ur.role.name)
    };

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user's own password
const updatePassword = async (req, res) => {
  try {
    const currentUser = req.user; // User from authentication middleware
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    // Ensure user can only update their own password
    const userId = currentUser.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Hash and update password
    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword }
    });

    res.status(200).json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  updatePassword
};