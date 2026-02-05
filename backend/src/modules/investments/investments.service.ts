import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from './entities/investment.entity';
import { Ativo } from './entities/ativo.entity';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private investmentRepository: Repository<Investment>,
    @InjectRepository(Ativo)
    private ativoRepository: Repository<Ativo>,
  ) {}

  // ========== ATIVOS (tabela fixa) ==========
  
  async findAllAtivos(): Promise<Ativo[]> {
    return this.ativoRepository.find({
      order: { ticker: 'ASC' },
    });
  }

  async findAtivosByTipo(tipo: string): Promise<Ativo[]> {
    return this.ativoRepository.find({
      where: { tipo },
      order: { ticker: 'ASC' },
    });
  }

  async findAtivoById(id: number): Promise<Ativo> {
    const ativo = await this.ativoRepository.findOne({
      where: { id },
    });
    if (!ativo) {
      throw new NotFoundException('Ativo não encontrado');
    }
    return ativo;
  }

  async updateAtivoPrice(id: number, precoAtual: number): Promise<Ativo> {
    const ativo = await this.findAtivoById(id);
    ativo.precoAtual = precoAtual;
    return this.ativoRepository.save(ativo);
  }

  // ========== INVESTMENTS (transações do usuário) ==========

  async findAll(userId: string): Promise<Investment[]> {
    return this.investmentRepository.find({
      where: { userId },
      relations: ['ativo'],
      order: { purchaseDate: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Investment> {
    const investment = await this.investmentRepository.findOne({
      where: { id, userId },
      relations: ['ativo'],
    });
    if (!investment) {
      throw new NotFoundException('Investimento não encontrado');
    }
    return investment;
  }

  async create(
    userId: string,
    data: {
      ativoId: number;
      quantity: number;
      purchasePrice: number;
      purchaseDate: string;
      broker?: string;
    },
  ): Promise<Investment> {
    // Validações
    if (data.quantity <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero');
    }

    if (data.purchasePrice <= 0) {
      throw new BadRequestException('O valor de compra deve ser maior que zero');
    }

    const purchaseDate = new Date(data.purchaseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    if (purchaseDate > today) {
      throw new BadRequestException('A data de compra não pode ser maior que a data atual');
    }

    // Verificar se o ativo existe
    await this.findAtivoById(data.ativoId);

    const investment = this.investmentRepository.create({
      userId,
      ativoId: data.ativoId,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      purchaseDate: purchaseDate,
      broker: data.broker || null,
    });
    
    const saved = await this.investmentRepository.save(investment);
    return this.findOne(saved.id, userId);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      ativoId: number;
      quantity: number;
      purchasePrice: number;
      purchaseDate: string;
      broker: string;
    }>,
  ): Promise<Investment> {
    const investment = await this.findOne(id, userId);
    
    // Validações
    if (data.quantity !== undefined && data.quantity <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero');
    }

    if (data.purchasePrice !== undefined && data.purchasePrice <= 0) {
      throw new BadRequestException('O valor de compra deve ser maior que zero');
    }

    if (data.purchaseDate) {
      const purchaseDate = new Date(data.purchaseDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (purchaseDate > today) {
        throw new BadRequestException('A data de compra não pode ser maior que a data atual');
      }
      investment.purchaseDate = purchaseDate;
    }

    if (data.ativoId) {
      await this.findAtivoById(data.ativoId);
      investment.ativoId = data.ativoId;
    }
    if (data.quantity !== undefined) investment.quantity = data.quantity;
    if (data.purchasePrice !== undefined) investment.purchasePrice = data.purchasePrice;
    if (data.broker !== undefined) investment.broker = data.broker;

    await this.investmentRepository.save(investment);
    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const investment = await this.findOne(id, userId);
    await this.investmentRepository.remove(investment);
  }

  // ========== CARTEIRA CONSOLIDADA ==========

  async getPortfolio(userId: string) {
    const investments = await this.findAll(userId);
    
    // Agrupar por ativo
    const portfolioMap = new Map<number, {
      ativo: Ativo;
      totalQuantity: number;
      totalCost: number;
      transactions: Investment[];
    }>();

    for (const inv of investments) {
      const existing = portfolioMap.get(inv.ativoId);
      const quantity = Number(inv.quantity);
      const cost = quantity * Number(inv.purchasePrice);

      if (existing) {
        existing.totalQuantity += quantity;
        existing.totalCost += cost;
        existing.transactions.push(inv);
      } else {
        portfolioMap.set(inv.ativoId, {
          ativo: inv.ativo,
          totalQuantity: quantity,
          totalCost: cost,
          transactions: [inv],
        });
      }
    }

    // Converter para array com cálculos
    const portfolio = Array.from(portfolioMap.values()).map(item => {
      const currentValue = item.totalQuantity * Number(item.ativo.precoAtual);
      const profitLoss = currentValue - item.totalCost;
      const averagePrice = item.totalQuantity > 0 ? item.totalCost / item.totalQuantity : 0;

      // Encontrar a data da última transação
      const lastTransaction = item.transactions.reduce((latest, t) => {
        const tDate = new Date(t.purchaseDate);
        return tDate > latest ? tDate : latest;
      }, new Date(0));

      return {
        ativo: item.ativo,
        totalQuantity: item.totalQuantity,
        averagePrice,
        currentPrice: Number(item.ativo.precoAtual),
        totalCost: item.totalCost,
        currentValue,
        profitLoss,
        profitLossPercentage: item.totalCost > 0 ? (profitLoss / item.totalCost) * 100 : 0,
        transactionCount: item.transactions.length,
        lastTransactionDate: lastTransaction.toISOString(),
      };
    });

    // Totais
    const totalValue = portfolio.reduce((acc, p) => acc + p.currentValue, 0);
    const totalCost = portfolio.reduce((acc, p) => acc + p.totalCost, 0);
    const totalProfitLoss = totalValue - totalCost;

    return {
      items: portfolio,
      summary: {
        totalValue,
        totalCost,
        profitLoss: totalProfitLoss,
        profitLossPercentage: totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0,
        assetCount: portfolio.length,
      },
    };
  }
}
