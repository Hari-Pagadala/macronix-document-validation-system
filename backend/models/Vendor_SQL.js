const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const Vendor = sequelize.define('Vendor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true
    },
    company: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        trim: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    tableName: 'vendors'
});

// Hash password before saving
Vendor.beforeCreate(async (vendor) => {
    const salt = await bcrypt.genSalt(10);
    vendor.password = await bcrypt.hash(vendor.password, salt);
});

Vendor.beforeUpdate(async (vendor) => {
    if (vendor.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        vendor.password = await bcrypt.hash(vendor.password, salt);
    }
});

// Compare password method
Vendor.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Vendor;
