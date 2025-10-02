const prisma = require("../../config/prismaConfig");
const { NotFoundError } = require("../../resHandler/CustomError");
const { handlerOk } = require("../../resHandler/responseHandler");

const showAllAdminTransactions = async (req, res, next) => {
  try {
    const { id } = req.user;

    const findadminwallet = await prisma.adminWallet.findFirst({
      where: {
        adminId: id
      }
    });

    if (!findadminwallet) {
      throw new NotFoundError("admin wallet not found");
    }

    console.log(findadminwallet.balance, 'admin wallet');


    // return ''

    // const findadminwallettransactions = await prisma.adminWalletTransaction.findMany({
    //   where: {
    //     adminId: id
    //   }
    // });

    // if (findadminwallettransactions.length === 0) {
    //   throw new NotFoundError("wallet transaction not found")
    // }



    handlerOk(res, 200, {
      balance: findadminwallet.balance,
      // findadminwallettransactions
    }, "admin wallet and transaction found successfully")
  } catch (error) {
    next(error)
  }
}

module.exports = {
  showAllAdminTransactions
}