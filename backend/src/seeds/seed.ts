import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { User } from '../modules/users/entities/user.entity';
import { Institution } from '../modules/institutions/entities/institution.entity';
import { Account, AccountType } from '../modules/accounts/entities/account.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { TransactionsService } from '../modules/transactions/transactions.service';

const DEFAULT_USER_ID = 'bdbb72d3-60e5-459d-8d8e-a746d9bf8196';
const DEFAULT_USER_EMAIL = 'demo@unit.com';
const DEFAULT_PASSWORD = '123456';

async function ensureUser(userRepo: Repository<User>): Promise<User> {
  const existing = await userRepo.findOne({ where: { id: DEFAULT_USER_ID } });

  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const user = userRepo.create({
    id: DEFAULT_USER_ID,
    fullName: 'Usuário Demo',
    email: DEFAULT_USER_EMAIL,
    passwordHash,
  });

  return userRepo.save(user);
}

async function seedInstitutions(institutionRepo: Repository<Institution>): Promise<Record<string, Institution>> {
  const institutions: Array<Partial<Institution>> = [
    { name: 'C6 Bank', bankCode: '336' },
    { name: 'Banco Inter', bankCode: '077' },
    { name: 'Nubank', bankCode: '260' },
  ];

  const existing = await institutionRepo.find();
  const byName = new Map(existing.map(inst => [inst.name.toLowerCase(), inst]));

  const toInsert: Institution[] = [];

  for (const inst of institutions) {
    const found = byName.get(inst.name!.toLowerCase());
    if (found) continue;

    const entity = institutionRepo.create({
      name: inst.name!,
      bankCode: inst.bankCode,
    });
    toInsert.push(entity);
  }

  if (toInsert.length) {
    await institutionRepo.save(toInsert);
  }

  const persisted = await institutionRepo.find();
  return persisted.reduce<Record<string, Institution>>((acc, inst) => {
    acc[inst.name] = inst;
    return acc;
  }, {});
}

async function seedCategories(categoryRepo: Repository<Category>): Promise<Record<string, Category>> {
  const categoryNames = [
    'Alimentação',
    'Mercado',
    'Transporte',
    'Lazer',
    'Educação',
    'Outras',
  ];

  const categories = categoryNames.map((name) => ({ name }));
  await categoryRepo.upsert(categories, ['name']);

  const persisted = await categoryRepo.find();
  return persisted.reduce<Record<string, Category>>((acc, category) => {
    acc[category.name] = category;
    return acc;
  }, {});
}

async function seedAccounts(
  accountRepo: Repository<Account>,
  userId: string,
  institutions: Record<string, Institution>,
): Promise<Record<string, Account>> {
  const accountBlueprints: Array<Partial<Account> & { key: string }> = [
    {
      key: 'c6Card',
      name: 'C6 Bank - Cartão',
      type: AccountType.CARTAO_DE_CREDITO,
      institutionId: institutions['C6 Bank']?.id,
      currentBalance: -850.75,
    },
    {
      key: 'interConta',
      name: 'Banco Inter - Conta',
      type: AccountType.CONTA_CORRENTE,
      institutionId: institutions['Banco Inter']?.id,
      currentBalance: 4200,
    },
    {
      key: 'nubankCard',
      name: 'Nubank - Cartão',
      type: AccountType.CARTAO_DE_CREDITO,
      institutionId: institutions['Nubank']?.id,
      currentBalance: -1250.32,
    },
  ];

  const result: Record<string, Account> = {};

  for (const blueprint of accountBlueprints) {
    const found = await accountRepo.findOne({ where: { userId, name: blueprint.name } });
    if (found) {
      result[blueprint.key] = found;
      continue;
    }

    const created = accountRepo.create({
      userId,
      name: blueprint.name!,
      type: blueprint.type!,
      institutionId: blueprint.institutionId,
      currentBalance: blueprint.currentBalance,
    });

    result[blueprint.key] = await accountRepo.save(created);
  }

  return result;
}

async function seedTransactions(
  transactionsService: TransactionsService,
  userId: string,
  accounts: Record<string, Account>,
) {
  const interImports = [
    { date: new Date('2024-12-02'), descriptionRaw: 'Salário ACME LTDA', amount: 6200 },
    { date: new Date('2024-12-04'), descriptionRaw: 'Uber*Viagem Casa', amount: -34.9 },
    { date: new Date('2024-12-06'), descriptionRaw: 'Padaria Pão Quente', amount: -21.5 },
    { date: new Date('2024-12-10'), descriptionRaw: 'Transferência Poupança', amount: -400 },
  ];

  const c6Imports = [
    { date: new Date('2024-12-05'), descriptionRaw: 'IFood*Restaurante', amount: -79.9 },
    { date: new Date('2024-12-08'), descriptionRaw: 'Farmácia Popular', amount: -58.2 },
    { date: new Date('2024-12-11'), descriptionRaw: 'Netflix', amount: -55.9 },
  ];

  const nubankImports = [
    { date: new Date('2024-12-03'), descriptionRaw: 'Spotify', amount: -34.9 },
    { date: new Date('2024-12-07'), descriptionRaw: 'Lanchonete Central', amount: -48.3 },
  ];

  if (accounts.interConta) {
    await transactionsService.processImport(userId, accounts.interConta.id, interImports);
  }

  if (accounts.c6Card) {
    await transactionsService.processImport(userId, accounts.c6Card.id, c6Imports);
  }

  if (accounts.nubankCard) {
    await transactionsService.processImport(userId, accounts.nubankCard.id, nubankImports);
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const institutionRepo = app.get<Repository<Institution>>(getRepositoryToken(Institution));
    const accountRepo = app.get<Repository<Account>>(getRepositoryToken(Account));
    const categoryRepo = app.get<Repository<Category>>(getRepositoryToken(Category));
    const transactionsService = app.get(TransactionsService);

    const user = await ensureUser(userRepo);
    const institutions = await seedInstitutions(institutionRepo);
    await seedCategories(categoryRepo);
    const accounts = await seedAccounts(accountRepo, user.id, institutions);
    await seedTransactions(transactionsService, user.id, accounts);

    console.log('✅ Seed concluído com sucesso');
    console.log(`Usuário demo: ${DEFAULT_USER_EMAIL} / senha: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error('Erro ao executar seed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
