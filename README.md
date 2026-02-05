# Crypto Chat - EDteam Challenge

Una aplicación de chat impulsada por IA que permite consultar información en tiempo real sobre criptomonedas usando la API de CoinGecko.

## 🚀 Características

- **Chat con IA**: Interfaz conversacional usando Groq AI (Llama 3.3 70B)
- **Datos en tiempo real**: Información actualizada de CoinGecko
- **Tools inteligentes**: La IA decide cuándo consultar:
  - **Top 10 Criptomonedas**: Muestra las 10 criptos con mayor capitalización de mercado
  - **Consulta individual**: Busca información detallada de cualquier criptomoneda
- **UI moderna**: Interfaz construida con TailwindCSS v4 y componentes de ai-elements
- **Autocomplete**: Búsqueda de criptomonedas con sugerencias en tiempo real
- **Persistencia en la nube**: Historial de chat guardado en Upstash Redis
- **TypeScript**: Tipado completo para mayor seguridad

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16+ (App Router)
- **AI**: Vercel AI SDK v6 + Groq
- **Estilos**: TailwindCSS v4
- **UI Components**: ai-elements (Vercel)
- **Base de datos**: Upstash Redis (persistencia de historial)
- **API**: CoinGecko

## 📋 Requisitos

- Node.js 18+
- Cuenta de Groq (para la API key)
- Cuenta de CoinGecko (para la API key)
- Cuenta de Upstash (para Redis - opcional pero recomendado)

## ⚙️ Instalación

1. Clona el repositorio:

```bash
git clone <repo-url>
cd edteam-crypto-ai-challenge
```

2. Instala dependencias:

```bash
npm install
```

3. Crea el archivo `.env.local` con tus API keys:

```env
# Requeridas
GROQ_API_KEY=tu_api_key_de_groq
COINGECKO_API_KEY=tu_api_key_de_coingecko

# Upstash Redis (opcional - para persistencia del historial)
UPSTASH_REDIS_REST_URL=tu_url_de_upstash
UPSTASH_REDIS_REST_TOKEN=tu_token_de_upstash
```

### Configuración de Upstash Redis (opcional)

1. Crea una cuenta gratuita en [Upstash](https://upstash.com)
2. Crea una nueva base de datos Redis
3. Copia el `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` de la consola
4. Agrégalos a tu `.env.local`

> **Nota**: Si no configuras Upstash, la app funcionará pero sin persistencia del historial.

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 💬 Ejemplos de Uso

Puedes preguntarle al chat cosas como:

- "¿Cuáles son las criptos más valuadas?"
- "Muéstrame el top 10"
- "¿A cuánto está Bitcoin?"
- "Dame info de Ethereum"
- "Precio de SOL"

## 📁 Estructura del Proyecto

```
app/
├── api/chat/route.ts      # Endpoint de chat con tools
├── components/
│   ├── Chat.tsx           # Componente principal del chat
│   ├── ChatMessage.tsx    # Renderizado de mensajes
│   ├── CryptoCard.tsx     # Card de cripto individual
│   ├── CryptoTable.tsx    # Tabla del top 10
│   └── SourceBadge.tsx    # Badge de fuente de datos
├── lib/coingecko.ts       # Cliente de CoinGecko
├── lib/redis.ts           # Cliente de Upstash Redis
├── hooks/useChatHistory.ts # Hook de persistencia
├── types/crypto.ts        # Tipos TypeScript
└── page.tsx               # Página principal
```

## 🔧 Tools Disponibles

### `getTop10Cryptos`

Obtiene las 10 criptomonedas con mayor market cap. Muestra:

- Nombre y símbolo
- Precio actual (USD)
- Market cap
- Variación 24h (%)
- Logo

### `getCryptoByQuery`

Busca información de una cripto específica. Acepta:

- Nombre: "bitcoin", "ethereum"
- Símbolo: "btc", "eth", "sol"
- ID de CoinGecko

## 🗄️ Persistencia con Upstash Redis

El historial de chat se guarda automáticamente en Upstash Redis:

- **TTL**: 7 días (se renueva automáticamente con cada mensaje)
- **Debounce**: 500ms para evitar múltiples llamadas
- **Sesión**: ID único por navegador guardado en localStorage

### Free Tier de Upstash

- 256 MB de almacenamiento
- 500,000 comandos/mes
- Suficiente para proyectos pequeños y demos

## 🚀 Deploy

El proyecto está configurado para desplegarse fácilmente en Vercel:

```bash
npm run build
```

Recuerda configurar las variables de entorno en tu plataforma de hosting:

- `GROQ_API_KEY`
- `COINGECKO_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 📝 Licencia

MIT
