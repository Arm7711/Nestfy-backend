import User from '../models/User.js';

export const findByEmail = (email) =>
    User.findOne({ where: { email: email.toLowerCase().trim() } });

export const findById = (id) => User.findByPk(id);

export const existsByEmail = async (email) => !!(await findByEmail(email));

export const createUser = (data) => User.create(data);

export const updateUser = (id, data) =>
    User.update(data, { where: { id } });