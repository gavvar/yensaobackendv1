"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Associations với các model khác
      // User.hasOne(models.Cart, { foreignKey: "userId", as: "cart" });
      // // Tạm thời comment lại cho đến khi model khác được tạo
      // // User.hasMany(models.Order);
      // console.log("Mối quan hệ User với model khác đã bị tạm comment");
      // User.hasMany(models.Review, { foreignKey: "userId", as: "reviews" });
      // User.hasMany(models.Address, { foreignKey: "userId", as: "addresses" });
      // User.hasMany(models.SomeOtherModel); // Model này không tồn tại hoặc không được định nghĩa đúng
    }

    // Instance Method: Loại bỏ password khi chuyển thành JSON
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      delete values.resetPasswordToken;
      delete values.resetPasswordExpires;
      return values;
    }

    // Instance Method: So sánh password
    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    // Instance Method: Lấy thông tin cơ bản
    getBasicProfile() {
      const { id, fullName, email, role, avatar } = this;
      return { id, fullName, email, role, avatar };
    }
  }

  User.init(
    {
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Tên không được để trống" },
          len: {
            args: [2, 100],
            msg: "Tên phải từ 2 đến 100 ký tự",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Email này đã được sử dụng",
        },
        validate: {
          isEmail: {
            msg: "Email không hợp lệ",
          },
          notEmpty: { msg: "Email không được để trống" },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Mật khẩu không được để trống" },
          len: {
            args: [6, 100],
            msg: "Mật khẩu phải từ 6 đến 100 ký tự",
          },
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
          is: {
            args: /^\+?[0-9]{10,15}$/,
            msg: "Số điện thoại không hợp lệ",
          },
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("customer", "admin"),
        defaultValue: "customer",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
      scopes: {
        withoutPassword: {
          attributes: {
            exclude: ["password", "resetPasswordToken", "resetPasswordExpires"],
          },
        },
        admin: {
          where: { role: "admin" },
        },
        active: {
          where: { isActive: true },
        },
      },
    }
  );

  // Class methods
  User.findByEmail = async function (email) {
    return this.scope("withoutPassword").findOne({ where: { email } });
  };

  User.findByEmailWithPassword = async function (email) {
    return this.unscoped().findOne({ where: { email } });
  };

  User.findActiveAdmins = async function () {
    return this.scope(["withoutPassword", "admin", "active"]).findAll();
  };

  return User;
};
