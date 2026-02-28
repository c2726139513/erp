import { prisma } from './prisma';

/**
 * 生成下一个单据编号
 * 格式：年月-编号（如：202602-01）
 * @param type 单据类型：'invoice' | 'payment'
 * @returns 下一个可用的编号
 */
export async function generateNextNumber(type: 'invoice' | 'payment'): Promise<string> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `${yearMonth}-`;

  let records: Array<{ number: string }> = [];

  if (type === 'invoice') {
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      select: {
        invoiceNumber: true,
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      take: 1,
    });
    records = invoices.map((inv) => ({ number: inv.invoiceNumber }));
  } else {
    const payments = await prisma.payment.findMany({
      where: {
        paymentNumber: {
          startsWith: prefix,
        },
      },
      select: {
        paymentNumber: true,
      },
      orderBy: {
        paymentNumber: 'desc',
      },
      take: 1,
    });
    records = payments.map((pay) => ({ number: pay.paymentNumber }));
  }

  let nextNumber = 1;

  if (records.length > 0) {
    const lastNumber = records[0].number;
    const lastSequence = parseInt(lastNumber.split('-')[1], 10);
    if (!isNaN(lastSequence)) {
      nextNumber = lastSequence + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(2, '0')}`;
}
