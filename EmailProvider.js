const nodemailer = require("nodemailer");

async function createEtherealProvider() {
  const testAccount = await nodemailer.createTestAccount();
  return {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    user: testAccount.user,
    pass: testAccount.pass,
  };
}

async function setupProviders() {
  const firstProvider = await createEtherealProvider();
  const secondProvider = await createEtherealProvider();

  return {
    firstProvider,
    secondProvider,
  };
}

module.exports = setupProviders;


//static providers

// module.exports = {
//   firstProvider: {
//     host: "smtp.ethereal.email",
//     port: 587,
//     secure: false,
//     user: "test1@ethereal.email",
//     pass: "jn7jnAPss4f63QBp6D",
//   },
//   secondProvider: {
//     host: "smtp.ethereal.email",
//     port: 587,
//     secure: false,
//     user: "test2@ethereal.email",
//     pass: "anotherpassword",
//   },
// };
