'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('records', 'submittedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Server-side timestamp when submission was received'
    });

    await queryInterface.addColumn('records', 'isLateSubmission', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('records', 'submittedAt');
    await queryInterface.removeColumn('records', 'isLateSubmission');
  }
};
