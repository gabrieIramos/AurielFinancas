#!/usr/bin/env node

/**
 * Script para otimizar o logo.png (7.76 MB é muito grande!)
 * 
 * Este script demonstra como otimizar a imagem.
 * Use ferramentas online se não tiver sharp instalado:
 * - https://tinypng.com/
 * - https://squoosh.app/
 * - https://compressor.io/
 */

console.log('\n🎨 OTIMIZAÇÃO DO LOGO\n');
console.log('O logo atual (src/public/logo.png) tem 7.76 MB!');
console.log('Isso está causando LCP de 41.4 segundos.\n');
console.log('📦 SOLUÇÕES:\n');
console.log('1. Online (Recomendado - Mais Fácil):');
console.log('   - Acesse: https://tinypng.com/');
console.log('   - Upload: src/public/logo.png');
console.log('   - Baixe a versão otimizada');
console.log('   - Substitua o arquivo original\n');
console.log('2. Squoosh (Google):');
console.log('   - Acesse: https://squoosh.app/');
console.log('   - Upload e ajuste qualidade para 80-85%');
console.log('   - Baixe como PNG otimizado ou WebP\n');
console.log('3. ImageMagick (se instalado):');
console.log('   convert src/public/logo.png -resize 512x512 -quality 85 src/public/logo-optimized.png\n');
console.log('🎯 META: Reduzir de 7.76 MB para < 200 KB\n');
console.log('💡 DICA: Use WebP ao invés de PNG para melhor compressão!\n');
