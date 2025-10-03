const { Pool } = require('pg');

// Configuração do banco de dados
const dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    
    // Pool configuration
    max: 20, // máximo de conexões no pool
    idleTimeoutMillis: 30000, // fechar conexões inativas após 30s
    connectionTimeoutMillis: 2000, // timeout para nova conexão
};

// Create pool
const pool = new Pool(dbConfig);

// Test connection
pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro de conexão PostgreSQL:', err);
});

// Singleton pour garantir apenas uma instância do pool
class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }
        Database.instance = this;
        this.pool = pool;
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('📊 Query executada em', duration, 'ms');
            return res;
        } catch (error) {
            console.error('❌ Erro na query:', error.message);
            throw error;
        }
    }

    async getClient() {
        return await this.pool.connect();
    }

    // Método para transações
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Health check do banco
    async healthCheck() {
        try {
            const result = await this.query('SELECT NOW()');
            return {
                status: 'healthy',
                timestamp: result.rows[0].now,
                database: 'PostgreSQL'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                database: 'PostgreSQL'
            };
        }
    }
}

const db = new Database();

module.exports = {
    query: (text, params) => db.query(text, params),
    getClient: () => db.getClient(),
    transaction: (callback) => db.transaction(callback),
    healthCheck: () => db.healthCheck()
};
