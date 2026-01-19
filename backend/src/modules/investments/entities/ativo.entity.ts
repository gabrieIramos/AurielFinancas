import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Investment } from './investment.entity';

@Entity('ativo')
export class Ativo {
  @PrimaryGeneratedColumn('identity', { name: 'id_ativo', type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  ticker: string;

  @Column({ type: 'varchar', length: 255 })
  tipo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  categoria: string;

  @Column({
    name: 'preco_atual',
    type: 'numeric',
    precision: 38,
    scale: 2,
  })
  precoAtual: number;

  @CreateDateColumn({ name: 'data_criacao', type: 'timestamp', default: () => 'LOCALTIMESTAMP' })
  dataCriacao: Date;

  @OneToMany(() => Investment, (investment) => investment.ativo)
  investments: Investment[];
}
