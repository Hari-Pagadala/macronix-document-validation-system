const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const FieldOfficer = sequelize.define('FieldOfficer', {
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
    vendor: {
        type: DataTypes.UUID,
        allowNull: false
    },
    vendorName: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    tableName: 'field_officers'
});

// Hash password before saving
FieldOfficer.beforeCreate(async (officer) => {
    const salt = await bcrypt.genSalt(10);
    officer.password = await bcrypt.hash(officer.password, salt);
});

FieldOfficer.beforeUpdate(async (officer) => {
    if (officer.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        officer.password = await bcrypt.hash(officer.password, salt);
    }
});

// Compare password method
FieldOfficer.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = FieldOfficer;
