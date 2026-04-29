const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Validador BagIt para pacotes SIP (Submission Information Package)
 * Baseado em: https://tools.ietf.org/html/draft-kunze-bagit-16
 */

function calculateHash(filePath, algorithm = 'md5') {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash(algorithm);
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Valida a estrutura BagIt de um diretório extraído
 * @param {string} bagPath - Caminho para o diretório do bag
 * @returns {object} { valid: boolean, errors: [], warnings: [] }
 */
function validateBagStructure(bagPath) {
    const errors = [];
    const warnings = [];

    // 1. Verificar se existe ficheiro bagit.txt
    const bagitFilePath = path.join(bagPath, 'bagit.txt');
    if (!fs.existsSync(bagitFilePath)) {
        warnings.push({
            componente: 'bagit.txt',
            status: 'Aviso',
            mensagem: 'Ficheiro bagit.txt não encontrado. BagIt optional - structure may still be valid'
        });
    } else {
        // Validar conteúdo de bagit.txt
        const bagitContent = fs.readFileSync(bagitFilePath, 'utf8');
        if (!bagitContent.includes('BagIt-Version:')) {
            warnings.push({
                componente: 'bagit.txt',
                status: 'Aviso',
                mensagem: 'Ficheiro bagit.txt não contém BagIt-Version'
            });
        }
    }

    // 2. Verificar se existe diretório "data"
    let dataDir = path.join(bagPath, 'data');
    if (!fs.existsSync(dataDir)) {
        // Se não houver pasta "data", usamos a raiz do ZIP como repositório de ficheiros
        dataDir = bagPath;
        warnings.push({
            componente: 'Estrutura',
            status: 'Aviso',
            mensagem: 'Diretório "data" não encontrado. Usando a raiz como base de ficheiros.'
        });
    }

    // 3. Verificar se há ficheiros
    const dataFiles = fs.readdirSync(dataDir, { recursive: true })
        .filter(f => !fs.statSync(path.join(dataDir, f)).isDirectory())
        .filter(f => !f.toLowerCase().includes('manifest') && !f.toLowerCase().includes('bagit.txt'));
    
    if (dataFiles.length === 0) {
        errors.push({
            componente: 'SIP',
            status: 'Erro',
            erro: 'O pacote não contém ficheiros educativos (excluindo o manifesto).'
        });
    }

    return { 
        valid: errors.length === 0, 
        errors, 
        warnings 
    };
}

/**
 * Lê manifesto (pode ser manifest.txt ou manifest.json)
 * @param {string} manifestContent - Conteúdo do ficheiro manifesto
 * @returns {object} { files: { filename: hash }, tagManifest: { filename: hash } }
 */
function parseManifest(manifestContent) {
    const result = {
        files: {},
        algorithm: 'md5'
    };

    try {
        // Tentar como JSON
        const json = JSON.parse(manifestContent);
        if (json.files) {
            result.files = json.files;
        }
        if (json.algorithm) {
            result.algorithm = json.algorithm;
        }
        return result;
    } catch (e) {
        // Formato BagIt padrão: "algorithm filename hash" ou "hash filename"
        // Ou simplesmente lista de ficheiros
    }

    // Parse formato texto BagIt
    const lines = manifestContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    
    lines.forEach(line => {
        const parts = line.split(/\s+/);
        
        if (parts.length >= 2) {
            // Detectar se é "hash filename" ou "filename hash"
            // Se a primeira parte tem 32 chars e é hex, é provavelmente um hash MD5
            if (/^[a-f0-9]{32}$/.test(parts[0])) {
                // Formato: "hash filename [...]"
                const hash = parts[0];
                const filename = parts.slice(1).join(' ');
                result.files[filename] = hash;
                result.algorithm = 'md5';
            } else if (/^[a-f0-9]{40}$/.test(parts[0])) {
                // SHA1
                const hash = parts[0];
                const filename = parts.slice(1).join(' ');
                result.files[filename] = hash;
                result.algorithm = 'sha1';
            } else if (/^[a-f0-9]{64}$/.test(parts[0])) {
                // SHA256
                const hash = parts[0];
                const filename = parts.slice(1).join(' ');
                result.files[filename] = hash;
                result.algorithm = 'sha256';
            } else {
                // Apenas lista de ficheiros
                result.files[line] = null;
            }
        }
    });

    return result;
}

/**
 * Valida integridade de ficheiros contra manifesto
 * @param {string} bagPath - Caminho para o diretório do bag
 * @param {object} manifesto - { files: { filename: hash }, algorithm: 'md5|sha1|sha256' }
 * @returns {object} { valid: boolean, errors: [], warnings: [] }
 */
function validateFileIntegrity(bagPath, manifesto) {
    const errors = [];
    const warnings = [];

    let dataDir = path.join(bagPath, 'data');
    if (!fs.existsSync(dataDir)) {
        dataDir = bagPath;
    }

    // Recolher ficheiros reais no diretório data ou raiz
    const actualFiles = {};
    const readdirRecursive = (dir, prefix = '') => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const relPath = prefix ? `${prefix}/${file}` : file;
            
            if (fs.statSync(fullPath).isDirectory()) {
                readdirRecursive(fullPath, relPath);
            } else {
                actualFiles[relPath] = fullPath;
            }
        });
    };
    
    readdirRecursive(dataDir);

    // Validar ficheiros listados no manifesto
    Object.entries(manifesto.files).forEach(([filename, expectedHash]) => {
        const actualPath = actualFiles[filename];

        if (!actualPath) {
            errors.push({
                componente: filename,
                status: 'Em Falta',
                erro: `Ficheiro listado no manifesto não encontrado: ${filename}`
            });
            return;
        }

        // Se não há hash no manifesto, apenas verificar que existe
        if (!expectedHash || expectedHash.length < 8) {
            warnings.push({
                componente: filename,
                status: 'Sem Checksum',
                mensagem: `Nenhum checksum fornecido para ${filename}`
            });
            return;
        }

        // Validar checksum
        try {
            const algorithm = manifesto.algorithm || 'md5';
            const actualHash = calculateHash(actualPath, algorithm);
            const normalizedExpected = expectedHash.toLowerCase();
            const normalizedActual = actualHash.toLowerCase();

            if (normalizedExpected !== normalizedActual) {
                errors.push({
                    componente: filename,
                    status: 'Integridade Comprometida',
                    erro: `Checksum ${algorithm.toUpperCase()} não bate. Esperado: ${normalizedExpected}, Calculado: ${normalizedActual}`
                });
            }
        } catch (e) {
            errors.push({
                componente: filename,
                status: 'Erro ao Validar',
                erro: `Não foi possível calcular checksum: ${e.message}`
            });
        }
    });

    // Verificar se há ficheiros em data que não estão no manifesto
    Object.keys(actualFiles).forEach(filename => {
        if (!manifesto.files[filename]) {
            warnings.push({
                componente: filename,
                status: 'Não Listado',
                mensagem: `Ficheiro encontrado mas não listado no manifesto: ${filename}`
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validação completa do pacote SIP
 * @param {string} bagPath - Caminho para o diretório do bag extraído
 * @param {AdmZip.IZipEntry} manifestEntry - Entry do manifesto do ZIP
 * @returns {object} { valid: boolean, errors: [], warnings: [], manifesto: object }
 */
function validateSIP(bagPath, manifestContent) {
    const validacoes = {
        valid: true,
        errors: [],
        warnings: [],
        manifesto: null
    };

    // 1. Validar estrutura BagIt
    const structureValidation = validateBagStructure(bagPath);
    validacoes.errors = [...validacoes.errors, ...structureValidation.errors];
    validacoes.warnings = [...validacoes.warnings, ...structureValidation.warnings];

    if (!structureValidation.valid) {
        validacoes.valid = false;
        return validacoes;
    }

    // 2. Parser manifesto
    if (!manifestContent || manifestContent.trim().length === 0) {
        validacoes.errors.push({
            componente: 'Manifesto',
            status: 'Vazio',
            erro: 'Ficheiro de manifesto vazio ou não fornecido'
        });
        validacoes.valid = false;
        return validacoes;
    }

    const manifesto = parseManifest(manifestContent);
    validacoes.manifesto = manifesto;

    // 3. Validar integridade de ficheiros
    const integrityValidation = validateFileIntegrity(bagPath, manifesto);
    validacoes.errors = [...validacoes.errors, ...integrityValidation.errors];
    validacoes.warnings = [...validacoes.warnings, ...integrityValidation.warnings];

    validacoes.valid = integrityValidation.valid && validacoes.errors.length === 0;
    return validacoes;
}

module.exports = {
    validateSIP,
    validateBagStructure,
    validateFileIntegrity,
    parseManifest,
    calculateHash
};
