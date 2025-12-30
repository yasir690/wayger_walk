const prisma = require("../../config/prismaConfig");
const { NotFoundError, BadRequestError, ValidationError } = require("../../resHandler/CustomError");
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

    const findadminwallettransactions = await prisma.adminWalletTransaction.findMany({
      where: {
        walletId: findadminwallet.id
      }
    });

    if (findadminwallettransactions.length === 0) {
      throw new NotFoundError("wallet transaction not found")
    }



    handlerOk(res, 200, {
      balance: findadminwallet.balance,
      findadminwallettransactions
    }, "admin wallet and transaction found successfully")
  } catch (error) {
    next(error)
  }
}

const createWithdrawalRequest = async (req, res, next) => {
  try {
    const { id } = req.user;
    const { amount, description } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new ValidationError("Amount must be greater than 0");
    }

    const withdrawalAmount = parseFloat(amount);

    // Find admin wallet
    const findadminwallet = await prisma.adminWallet.findFirst({
      where: {
        adminId: id
      }
    });

    if (!findadminwallet) {
      throw new NotFoundError("admin wallet not found");
    }

    // Check if balance is sufficient
    if (findadminwallet.balance < withdrawalAmount) {
      throw new BadRequestError(`Insufficient balance. Available balance: ${findadminwallet.balance}`);
    }

    // Create withdrawal transaction and update balance atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update wallet balance (deduct withdrawal amount)
      const updatedWallet = await tx.adminWallet.update({
        where: { id: findadminwallet.id },
        data: {
          balance: {
            decrement: withdrawalAmount
          }
        }
      });

      // Create withdrawal transaction (negative amount for debit)
      const withdrawalTransaction = await tx.adminWalletTransaction.create({
        data: {
          walletId: findadminwallet.id,
          amount: -withdrawalAmount, // Negative for withdrawal (debit)
          description: description || `Withdrawal of ${withdrawalAmount}`
        }
      });

      return {
        wallet: updatedWallet,
        transaction: withdrawalTransaction
      };
    });

    handlerOk(res, 201, {
      balance: result.wallet.balance,
      transaction: result.transaction
    }, "Withdrawal request processed successfully")
  } catch (error) {
    next(error)
  }
}

module.exports = {
  showAllAdminTransactions,
  createWithdrawalRequest
}