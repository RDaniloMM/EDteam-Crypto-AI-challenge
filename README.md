# Crypto Chat - EDteam Challenge

Una aplicación de chat impulsada por IA que permite consultar información en tiempo real sobre criptomonedas usando la API de CoinGecko.

## 🚀 Características

- **Chat con IA**: Interfaz conversacional usando Vercel AI Gateway (Google Gemini 3 Flash)
- **Datos en tiempo real**: Información actualizada de CoinGecko
- **Tools inteligentes**: La IA decide cuándo consultar:
  - **Top 10 Criptomonedas**: Muestra las 10 criptos con mayor capitalización de mercado
  - **Consulta individual**: Busca información detallada de cualquier criptomoneda
  - **Búsqueda por categoría**: Filtra criptos por categoría (memes, DeFi, Layer 1, etc.)
- **Manejo de ambigüedad**: Si hay múltiples criptos que coinciden, muestra sugerencias
- **UI moderna**: Interfaz construida con TailwindCSS v4 y componentes de ai-elements
- **Autocomplete**: Búsqueda de criptomonedas con sugerencias en tiempo real
- **Persistencia en la nube**: Historial de chat guardado en Upstash Redis
- **TypeScript**: Tipado completo para mayor seguridad

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16+ (App Router)
- **AI**: Vercel AI SDK v6 + Vercel AI Gateway (Google Gemini 3 Flash Preview)
- **Estilos**: TailwindCSS v4
- **UI Components**: ai-elements (Vercel)
- **Base de datos**: Upstash Redis (persistencia de historial)
- **API**: CoinGecko

## 📋 Requisitos

- Node.js 18+
- Cuenta de Vercel AI Gateway (para la API key)
- Cuenta de CoinGecko (para la API key)
- Cuenta de Upstash (para Redis - opcional pero recomendado)

## ⚙️ Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/RDaniloMM/EDteam-Crypto-AI-challenge
cd edteam-crypto-ai-challenge
```

2. Instala dependencias:

```bash
npm install
```

3. Crea el archivo `.env.local` con tus API keys:

```env
# Requeridas
AI_GATEWAY_API_KEY=tu_api_key_de_vercel_ai_gateway
COINGECKO_API_KEY=tu_api_key_de_coingecko
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3

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
- "Dame las memecoins más importantes"

## 📁 Estructura del Proyecto

```
app/
├── api/
│   ├── chat/route.ts      # Endpoint de chat con tools
│   ├── conversations/     # API de conversaciones
│   ├── history/           # API de historial
│   └── search/            # API de búsqueda de criptos
├── components/
│   ├── Chat.tsx           # Componente principal del chat
│   ├── ChatMessage.tsx    # Renderizado de mensajes y tools
│   ├── ChatSidebar.tsx    # Sidebar con historial
│   ├── CryptoCard.tsx     # Card de cripto individual
│   ├── CryptoTable.tsx    # Tabla del top 10/categorías
│   └── SourceBadge.tsx    # Badge de fuente de datos
├── lib/
│   ├── coingecko.ts       # Cliente de CoinGecko (lógica de búsqueda)
│   └── redis.ts           # Cliente de Upstash Redis
├── hooks/
│   ├── useChatHistory.ts  # Hook de persistencia
│   └── useConversations.ts # Hook de conversaciones
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

**Manejo de ambigüedad**: Si el término buscado coincide con múltiples criptomonedas relevantes (top 500), muestra una lista de sugerencias para que el usuario elija.

### `getCryptosByCategory`

Obtiene las criptomonedas más importantes de una categoría. Categorías disponibles:

- `meme` / `memecoins` - Memecoins
- `defi` - Finanzas descentralizadas
- `layer-1` / `l1` - Blockchains Layer 1
- `layer-2` / `l2` - Soluciones Layer 2
- `gaming` - Gaming y Play-to-Earn
- `ai` - Inteligencia Artificial
- `nft` - Tokens NFT
- `stablecoins` - Monedas estables

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

- `AI_GATEWAY_API_KEY`
- `COINGECKO_API_KEY`
- `COINGECKO_BASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

---

## 🏗️ Arquitectura y Decisiones Técnicas

### Consumo de CoinGecko

**Endpoints utilizados:**

- `/coins/markets` - Top 10 y datos de criptos individuales (más rápido que `/coins/{id}`)
- `/search` - Búsqueda de criptos por nombre/símbolo
- `/coins/categories/list` - Lista de categorías disponibles

**Estrategia de caché (revalidate):**
| Endpoint | Cache | Justificación |
|----------|-------|---------------|
| `/coins/markets` | 10s | Precios cambian frecuentemente, balance entre frescura y rate limits |
| `/search` | 60s | Resultados de búsqueda son estables |
| `/coins/categories/list` | 300s | Las categorías casi nunca cambian |
| Categorías (markets) | 30s | Datos menos críticos que el top 10 |

**Optimizaciones:**

- **Aliases de símbolos**: Mapeo directo de símbolos comunes (btc→bitcoin) evita llamadas a `/search`
- **`getCryptoByIdFast`**: Usa `/coins/markets?ids=X` en lugar de `/coins/{id}` (más rápido)
- **Detección de ambigüedad**: Filtra solo criptos con market_cap_rank ≤ 500 para evitar ruido


## Uso de IA para Programar

### Herramienta utilizada

**GitHub Copilot** (Gemini 3 Pro / Claude Opus 4.5) integrado en VS Code.

### Ejemplos de prompts utilizados


- **Implementación de tools:**

   > "Implementa una tool getCryptoByQuery que busque criptos por nombre o símbolo y maneje casos de ambigüedad"

- **Persistencia:**

   > "Agrega persistencia del historial de chat usando Upstash Redis con TTL de 7 días"

- **Manejo de categorías:**

   > "Agrega una tool getCryptosByCategory que obtenga criptos por categoría usando el endpoint de CoinGecko"

- **Debugging:**
   > "El builder me dio este error de compilación, dame sugerencias de como arreglarlo
   ⨯ TypeError: Cannot read properties of undefined (reading 'trim')
    at Chat (app\components\Chat.tsx:119:60)
  117 |             disabled={isLoading}
  118 |           />
> 119 |           <PromptInputSubmit disabled={isLoading || !input.trim()} />
      |                                                            ^
  120 |         </PromptInput>
  121 |       </div>
  122 |     </div> {
  digest: '3800306835'
  "

### Partes generadas por IA vs. corregidas manualmente

| Componente                              | Generado por IA | Corregido/Ajustado manualmente                                                                       |
| --------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| Estructura base del proyecto            | ✅              | -                                                                                                    |
| Componentes UI (Chat, CryptoCard, etc.) | ✅              | Estilos y detalles importantes para mejorar la UX |
| API routes y tools                      | ✅              | Ajustes manuales con la documentación de Zod y AI SDK, que la IA se equivoca colocando código deprecado -                                                                                                    |
| **Lógica de `coingecko.ts`**            | ✅ Base         | ✅ **Tiempos de `revalidate`**, **lógica de ambigüedad** (detección de múltiples matches relevantes) |
| Persistencia Redis                      | ✅              | -                                                                                                    |
| Manejo de errores de Gemini             | ✅ Workaround   | -                                                                                                    |
| Tipos TypeScript                        | ✅              | -                                                                                                    |

### Criterio de validación

- **Revisión de lógica de negocio**: Especialmente en `getCryptoByQuery` para asegurar que la detección de ambigüedad funcione correctamente
- **Testing manual**: Probé casos especiales como "binance"
- **Ajuste de cache**: Modifiqué los tiempos de `revalidate` según el tipo de dato y frecuencia de cambio esperada

---

## Verificación contra Alucinaciones

### Problema

El modelo de IA NO debe inventar precios o datos de criptomonedas. Todos los datos financieros deben provenir de CoinGecko.

### Solución técnica implementada

1. **System prompt estricto** (`app/api/chat/route.ts`):

   ```
   REGLAS IMPORTANTES:
   1. NUNCA inventes precios o datos de criptomonedas. SIEMPRE usa las tools disponibles.
   2. Si el usuario pregunta por precios, market cap, o cualquier dato de criptos, DEBES usar una tool.
   ```

2. **Tools como única fuente de datos**:
   - La IA no tiene acceso directo a datos de precios
   - Solo puede obtener datos llamando a las tools (`getTop10Cryptos`, `getCryptoByQuery`, `getCryptosByCategory`)
   - Las tools consultan la API de CoinGecko en tiempo real

3. **Indicador de fuente en la UI**:
   - El componente `SourceBadge` muestra "Fuente: CoinGecko" y timestamp
   - El usuario puede verificar que los datos son reales y cuándo se actualizaron

4. **Validación de datos**:
   - Los tipos TypeScript (`CryptoData`, `Top10Result`, etc.) garantizan la estructura
   - Si la API falla, se muestra un error claro, no datos inventados

### Cómo verificar que funciona

```
Usuario: "¿A cuánto está Bitcoin?"
```

✅ **Correcto**: La IA llama a `getCryptoByQuery("bitcoin")` → Muestra precio real con badge "CoinGecko"

❌ **Incorrecto** (prevenido): La IA responde "Bitcoin está a $50,000" sin llamar a ninguna tool

---

## 📝 Licencia

MIT
