const prisma = require('../db/prisma');

async function findByEmail(email) {
    return prisma.user.findUnique({
        where: {email}
    });
}

async function createUser(data) {
    try {
        return await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: data.passwordHash
            }
        });
    } catch(error) {
        if(error && error.code === 'P2002') {
            const conflict = new Error('Email already exists');
            conflict.statusCode = 409;
            conflict.code = 'EMAIL_ALREADY_EXISTS';
            throw conflict;
        }

        throw error;
    }
}

module.exports = {
    findByEmail,
    createUser
};