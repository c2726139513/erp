import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const contractType = searchParams.get('contractType');
    const forInvoices = searchParams.get('forInvoices'); // 用于发票筛选
    const forPayments = searchParams.get('forPayments'); // 用于收付款筛选
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (search) {
      where.OR = [
        { contractNumber: { contains: search } },
        { title: { contains: search } },
        { client: { name: { contains: search } } },
        { project: { name: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (contractType) {
      where.contractType = contractType;
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 过滤未完成的合同
    let filteredContracts = contracts as any[];
    
    if (forInvoices === 'true') {
      // 过滤已开发票金额 < 合同金额的合同
      filteredContracts = await Promise.all(contracts.map(async (contract) => {
        const invoices = await prisma.invoice.findMany({
          where: { contractId: contract.id }
        });
        const invoicedAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        return {
          ...contract,
          _invoicedAmount: invoicedAmount,
          _remainingAmount: contract.amount - invoicedAmount,
          _isCompleted: invoicedAmount >= contract.amount
        };
      }));
      filteredContracts = filteredContracts.filter((c: any) => !c._isCompleted);
    }
    
    if (forPayments === 'true') {
      // 过滤已付款金额 < 合同金额的合同
      filteredContracts = await Promise.all(contracts.map(async (contract) => {
        const payments = await prisma.payment.findMany({
          where: { contractId: contract.id }
        });
        const paidAmount = payments.reduce((sum, pay) => sum + pay.amount, 0);
        return {
          ...contract,
          _paidAmount: paidAmount,
          _remainingAmount: contract.amount - paidAmount,
          _isCompleted: paidAmount >= contract.amount
        };
      }));
      filteredContracts = filteredContracts.filter((c: any) => !c._isCompleted);
    }

    return NextResponse.json(successResponse(filteredContracts));
  } catch (error) {
    return handleApiError(error);
  }
}

  export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contractNumber,
      title,
      clientId,
      projectId,
      amount,
      status,
      contractType,
      startDate,
      endDate,
      description,
    } = body;

    if (!contractNumber || !title || !clientId || !amount) {
      return errorResponse('缺少必填字段');
    }

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        title,
        clientId,
        projectId: projectId || null,
        amount: parseFloat(amount),
        status: status || 'SIGNED',
        contractType: contractType || 'PURCHASE',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
      },
      include: {
        client: true,
        project: true,
      },
    });

    return NextResponse.json(successResponse(contract, '合同创建成功'), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
