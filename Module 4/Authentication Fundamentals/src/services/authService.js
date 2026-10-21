const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');

async function register(fields){
    if( 
        !fields ||
        typeof fields.name !== 'string' ||
        !fields.name.trim() ||
        typeof fields.email !== 'string' ||
        !fields.email.trim() ||
        typeof fields.password !== 'string' ||
        !fields.password.trim()
    ) {
        const error = new Error('Name, email and password are required');
        error.statusCode = 409;
        throw error;
    }

    const name = fields.name.trim();
    const email = fields.email.trim().toLowerCase();
    const cost = Number(process.env.BCRYPT_COST) || 12;
    const passwordHash = await bcrypt.hash(fields.password, cost);

    const user = await userRepository.createUser({
        name,
        email,
        passwordHash
    });

    return {
        id: user.id,
        name: user.name,
        email: user.email
    };
}

async function login(fields){
    if( 
        !fields ||
        typeof fields.email !== 'string' ||
        !fields.email.trim() ||
        typeof fields.password !== 'string' ||
        !fields.password.trim()
    ) {
        const error = new Error('Email and password are required');
        error.statusCode = 400;
        throw error;
    }

    const email = fields.email.trim().toLowerCase();
    const user = await userRepository.findByEmail(email);

    if(
        !user || 
        !(await bcrypt.compare(fields.password, user.passwordHash))
    ) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        error.code = 'INVALID_CREDENTIALS';
        throw error;
    }  
    
    return {
        id: user.id,
        name: user.name,
        email: user.email
    };
}

module.exports = {
    register,
    login
};
