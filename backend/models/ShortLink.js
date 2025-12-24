const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShortLink = sequelize.define('ShortLink', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    short_code: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        index: true
    },
    full_url: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    record_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        index: true
    },
    is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    used_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'short_links',
    timestamps: false
});

module.exports = ShortLink;
