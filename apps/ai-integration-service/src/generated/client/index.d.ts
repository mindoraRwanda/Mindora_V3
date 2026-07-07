
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model AiInteraction
 * 
 */
export type AiInteraction = $Result.DefaultSelection<Prisma.$AiInteractionPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more AiInteractions
 * const aiInteractions = await prisma.aiInteraction.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more AiInteractions
   * const aiInteractions = await prisma.aiInteraction.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.aiInteraction`: Exposes CRUD operations for the **AiInteraction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AiInteractions
    * const aiInteractions = await prisma.aiInteraction.findMany()
    * ```
    */
  get aiInteraction(): Prisma.AiInteractionDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    AiInteraction: 'AiInteraction'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "aiInteraction"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      AiInteraction: {
        payload: Prisma.$AiInteractionPayload<ExtArgs>
        fields: Prisma.AiInteractionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AiInteractionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AiInteractionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>
          }
          findFirst: {
            args: Prisma.AiInteractionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AiInteractionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>
          }
          findMany: {
            args: Prisma.AiInteractionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>[]
          }
          create: {
            args: Prisma.AiInteractionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>
          }
          createMany: {
            args: Prisma.AiInteractionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AiInteractionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>[]
          }
          delete: {
            args: Prisma.AiInteractionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>
          }
          update: {
            args: Prisma.AiInteractionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>
          }
          deleteMany: {
            args: Prisma.AiInteractionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AiInteractionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AiInteractionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>[]
          }
          upsert: {
            args: Prisma.AiInteractionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AiInteractionPayload>
          }
          aggregate: {
            args: Prisma.AiInteractionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAiInteraction>
          }
          groupBy: {
            args: Prisma.AiInteractionGroupByArgs<ExtArgs>
            result: $Utils.Optional<AiInteractionGroupByOutputType>[]
          }
          count: {
            args: Prisma.AiInteractionCountArgs<ExtArgs>
            result: $Utils.Optional<AiInteractionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    aiInteraction?: AiInteractionOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model AiInteraction
   */

  export type AggregateAiInteraction = {
    _count: AiInteractionCountAggregateOutputType | null
    _avg: AiInteractionAvgAggregateOutputType | null
    _sum: AiInteractionSumAggregateOutputType | null
    _min: AiInteractionMinAggregateOutputType | null
    _max: AiInteractionMaxAggregateOutputType | null
  }

  export type AiInteractionAvgAggregateOutputType = {
    crisis_level: number | null
    tokens_used: number | null
    response_ms: number | null
  }

  export type AiInteractionSumAggregateOutputType = {
    crisis_level: number | null
    tokens_used: number | null
    response_ms: number | null
  }

  export type AiInteractionMinAggregateOutputType = {
    id: string | null
    user_id: string | null
    session_id: string | null
    user_message: string | null
    ai_response: string | null
    input_flagged: boolean | null
    output_flagged: boolean | null
    crisis_level: number | null
    tokens_used: number | null
    response_ms: number | null
    created_at: Date | null
  }

  export type AiInteractionMaxAggregateOutputType = {
    id: string | null
    user_id: string | null
    session_id: string | null
    user_message: string | null
    ai_response: string | null
    input_flagged: boolean | null
    output_flagged: boolean | null
    crisis_level: number | null
    tokens_used: number | null
    response_ms: number | null
    created_at: Date | null
  }

  export type AiInteractionCountAggregateOutputType = {
    id: number
    user_id: number
    session_id: number
    user_message: number
    ai_response: number
    input_flagged: number
    output_flagged: number
    crisis_level: number
    tokens_used: number
    response_ms: number
    created_at: number
    _all: number
  }


  export type AiInteractionAvgAggregateInputType = {
    crisis_level?: true
    tokens_used?: true
    response_ms?: true
  }

  export type AiInteractionSumAggregateInputType = {
    crisis_level?: true
    tokens_used?: true
    response_ms?: true
  }

  export type AiInteractionMinAggregateInputType = {
    id?: true
    user_id?: true
    session_id?: true
    user_message?: true
    ai_response?: true
    input_flagged?: true
    output_flagged?: true
    crisis_level?: true
    tokens_used?: true
    response_ms?: true
    created_at?: true
  }

  export type AiInteractionMaxAggregateInputType = {
    id?: true
    user_id?: true
    session_id?: true
    user_message?: true
    ai_response?: true
    input_flagged?: true
    output_flagged?: true
    crisis_level?: true
    tokens_used?: true
    response_ms?: true
    created_at?: true
  }

  export type AiInteractionCountAggregateInputType = {
    id?: true
    user_id?: true
    session_id?: true
    user_message?: true
    ai_response?: true
    input_flagged?: true
    output_flagged?: true
    crisis_level?: true
    tokens_used?: true
    response_ms?: true
    created_at?: true
    _all?: true
  }

  export type AiInteractionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AiInteraction to aggregate.
     */
    where?: AiInteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiInteractions to fetch.
     */
    orderBy?: AiInteractionOrderByWithRelationInput | AiInteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AiInteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiInteractions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiInteractions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AiInteractions
    **/
    _count?: true | AiInteractionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AiInteractionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AiInteractionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AiInteractionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AiInteractionMaxAggregateInputType
  }

  export type GetAiInteractionAggregateType<T extends AiInteractionAggregateArgs> = {
        [P in keyof T & keyof AggregateAiInteraction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAiInteraction[P]>
      : GetScalarType<T[P], AggregateAiInteraction[P]>
  }




  export type AiInteractionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AiInteractionWhereInput
    orderBy?: AiInteractionOrderByWithAggregationInput | AiInteractionOrderByWithAggregationInput[]
    by: AiInteractionScalarFieldEnum[] | AiInteractionScalarFieldEnum
    having?: AiInteractionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AiInteractionCountAggregateInputType | true
    _avg?: AiInteractionAvgAggregateInputType
    _sum?: AiInteractionSumAggregateInputType
    _min?: AiInteractionMinAggregateInputType
    _max?: AiInteractionMaxAggregateInputType
  }

  export type AiInteractionGroupByOutputType = {
    id: string
    user_id: string
    session_id: string
    user_message: string
    ai_response: string
    input_flagged: boolean
    output_flagged: boolean
    crisis_level: number
    tokens_used: number | null
    response_ms: number | null
    created_at: Date
    _count: AiInteractionCountAggregateOutputType | null
    _avg: AiInteractionAvgAggregateOutputType | null
    _sum: AiInteractionSumAggregateOutputType | null
    _min: AiInteractionMinAggregateOutputType | null
    _max: AiInteractionMaxAggregateOutputType | null
  }

  type GetAiInteractionGroupByPayload<T extends AiInteractionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AiInteractionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AiInteractionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AiInteractionGroupByOutputType[P]>
            : GetScalarType<T[P], AiInteractionGroupByOutputType[P]>
        }
      >
    >


  export type AiInteractionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    session_id?: boolean
    user_message?: boolean
    ai_response?: boolean
    input_flagged?: boolean
    output_flagged?: boolean
    crisis_level?: boolean
    tokens_used?: boolean
    response_ms?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["aiInteraction"]>

  export type AiInteractionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    session_id?: boolean
    user_message?: boolean
    ai_response?: boolean
    input_flagged?: boolean
    output_flagged?: boolean
    crisis_level?: boolean
    tokens_used?: boolean
    response_ms?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["aiInteraction"]>

  export type AiInteractionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    user_id?: boolean
    session_id?: boolean
    user_message?: boolean
    ai_response?: boolean
    input_flagged?: boolean
    output_flagged?: boolean
    crisis_level?: boolean
    tokens_used?: boolean
    response_ms?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["aiInteraction"]>

  export type AiInteractionSelectScalar = {
    id?: boolean
    user_id?: boolean
    session_id?: boolean
    user_message?: boolean
    ai_response?: boolean
    input_flagged?: boolean
    output_flagged?: boolean
    crisis_level?: boolean
    tokens_used?: boolean
    response_ms?: boolean
    created_at?: boolean
  }

  export type AiInteractionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "user_id" | "session_id" | "user_message" | "ai_response" | "input_flagged" | "output_flagged" | "crisis_level" | "tokens_used" | "response_ms" | "created_at", ExtArgs["result"]["aiInteraction"]>

  export type $AiInteractionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AiInteraction"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      user_id: string
      session_id: string
      user_message: string
      ai_response: string
      input_flagged: boolean
      output_flagged: boolean
      crisis_level: number
      tokens_used: number | null
      response_ms: number | null
      created_at: Date
    }, ExtArgs["result"]["aiInteraction"]>
    composites: {}
  }

  type AiInteractionGetPayload<S extends boolean | null | undefined | AiInteractionDefaultArgs> = $Result.GetResult<Prisma.$AiInteractionPayload, S>

  type AiInteractionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AiInteractionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AiInteractionCountAggregateInputType | true
    }

  export interface AiInteractionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AiInteraction'], meta: { name: 'AiInteraction' } }
    /**
     * Find zero or one AiInteraction that matches the filter.
     * @param {AiInteractionFindUniqueArgs} args - Arguments to find a AiInteraction
     * @example
     * // Get one AiInteraction
     * const aiInteraction = await prisma.aiInteraction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AiInteractionFindUniqueArgs>(args: SelectSubset<T, AiInteractionFindUniqueArgs<ExtArgs>>): Prisma__AiInteractionClient<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AiInteraction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AiInteractionFindUniqueOrThrowArgs} args - Arguments to find a AiInteraction
     * @example
     * // Get one AiInteraction
     * const aiInteraction = await prisma.aiInteraction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AiInteractionFindUniqueOrThrowArgs>(args: SelectSubset<T, AiInteractionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AiInteractionClient<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AiInteraction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiInteractionFindFirstArgs} args - Arguments to find a AiInteraction
     * @example
     * // Get one AiInteraction
     * const aiInteraction = await prisma.aiInteraction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AiInteractionFindFirstArgs>(args?: SelectSubset<T, AiInteractionFindFirstArgs<ExtArgs>>): Prisma__AiInteractionClient<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AiInteraction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiInteractionFindFirstOrThrowArgs} args - Arguments to find a AiInteraction
     * @example
     * // Get one AiInteraction
     * const aiInteraction = await prisma.aiInteraction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AiInteractionFindFirstOrThrowArgs>(args?: SelectSubset<T, AiInteractionFindFirstOrThrowArgs<ExtArgs>>): Prisma__AiInteractionClient<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AiInteractions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiInteractionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AiInteractions
     * const aiInteractions = await prisma.aiInteraction.findMany()
     * 
     * // Get first 10 AiInteractions
     * const aiInteractions = await prisma.aiInteraction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const aiInteractionWithIdOnly = await prisma.aiInteraction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AiInteractionFindManyArgs>(args?: SelectSubset<T, AiInteractionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AiInteraction.
     * @param {AiInteractionCreateArgs} args - Arguments to create a AiInteraction.
     * @example
     * // Create one AiInteraction
     * const AiInteraction = await prisma.aiInteraction.create({
     *   data: {
     *     // ... data to create a AiInteraction
     *   }
     * })
     * 
     */
    create<T extends AiInteractionCreateArgs>(args: SelectSubset<T, AiInteractionCreateArgs<ExtArgs>>): Prisma__AiInteractionClient<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AiInteractions.
     * @param {AiInteractionCreateManyArgs} args - Arguments to create many AiInteractions.
     * @example
     * // Create many AiInteractions
     * const aiInteraction = await prisma.aiInteraction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AiInteractionCreateManyArgs>(args?: SelectSubset<T, AiInteractionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AiInteractions and returns the data saved in the database.
     * @param {AiInteractionCreateManyAndReturnArgs} args - Arguments to create many AiInteractions.
     * @example
     * // Create many AiInteractions
     * const aiInteraction = await prisma.aiInteraction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AiInteractions and only return the `id`
     * const aiInteractionWithIdOnly = await prisma.aiInteraction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AiInteractionCreateManyAndReturnArgs>(args?: SelectSubset<T, AiInteractionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AiInteraction.
     * @param {AiInteractionDeleteArgs} args - Arguments to delete one AiInteraction.
     * @example
     * // Delete one AiInteraction
     * const AiInteraction = await prisma.aiInteraction.delete({
     *   where: {
     *     // ... filter to delete one AiInteraction
     *   }
     * })
     * 
     */
    delete<T extends AiInteractionDeleteArgs>(args: SelectSubset<T, AiInteractionDeleteArgs<ExtArgs>>): Prisma__AiInteractionClient<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AiInteraction.
     * @param {AiInteractionUpdateArgs} args - Arguments to update one AiInteraction.
     * @example
     * // Update one AiInteraction
     * const aiInteraction = await prisma.aiInteraction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AiInteractionUpdateArgs>(args: SelectSubset<T, AiInteractionUpdateArgs<ExtArgs>>): Prisma__AiInteractionClient<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AiInteractions.
     * @param {AiInteractionDeleteManyArgs} args - Arguments to filter AiInteractions to delete.
     * @example
     * // Delete a few AiInteractions
     * const { count } = await prisma.aiInteraction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AiInteractionDeleteManyArgs>(args?: SelectSubset<T, AiInteractionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AiInteractions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiInteractionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AiInteractions
     * const aiInteraction = await prisma.aiInteraction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AiInteractionUpdateManyArgs>(args: SelectSubset<T, AiInteractionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AiInteractions and returns the data updated in the database.
     * @param {AiInteractionUpdateManyAndReturnArgs} args - Arguments to update many AiInteractions.
     * @example
     * // Update many AiInteractions
     * const aiInteraction = await prisma.aiInteraction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AiInteractions and only return the `id`
     * const aiInteractionWithIdOnly = await prisma.aiInteraction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AiInteractionUpdateManyAndReturnArgs>(args: SelectSubset<T, AiInteractionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AiInteraction.
     * @param {AiInteractionUpsertArgs} args - Arguments to update or create a AiInteraction.
     * @example
     * // Update or create a AiInteraction
     * const aiInteraction = await prisma.aiInteraction.upsert({
     *   create: {
     *     // ... data to create a AiInteraction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AiInteraction we want to update
     *   }
     * })
     */
    upsert<T extends AiInteractionUpsertArgs>(args: SelectSubset<T, AiInteractionUpsertArgs<ExtArgs>>): Prisma__AiInteractionClient<$Result.GetResult<Prisma.$AiInteractionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AiInteractions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiInteractionCountArgs} args - Arguments to filter AiInteractions to count.
     * @example
     * // Count the number of AiInteractions
     * const count = await prisma.aiInteraction.count({
     *   where: {
     *     // ... the filter for the AiInteractions we want to count
     *   }
     * })
    **/
    count<T extends AiInteractionCountArgs>(
      args?: Subset<T, AiInteractionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AiInteractionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AiInteraction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiInteractionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AiInteractionAggregateArgs>(args: Subset<T, AiInteractionAggregateArgs>): Prisma.PrismaPromise<GetAiInteractionAggregateType<T>>

    /**
     * Group by AiInteraction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AiInteractionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AiInteractionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AiInteractionGroupByArgs['orderBy'] }
        : { orderBy?: AiInteractionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AiInteractionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAiInteractionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AiInteraction model
   */
  readonly fields: AiInteractionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AiInteraction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AiInteractionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AiInteraction model
   */
  interface AiInteractionFieldRefs {
    readonly id: FieldRef<"AiInteraction", 'String'>
    readonly user_id: FieldRef<"AiInteraction", 'String'>
    readonly session_id: FieldRef<"AiInteraction", 'String'>
    readonly user_message: FieldRef<"AiInteraction", 'String'>
    readonly ai_response: FieldRef<"AiInteraction", 'String'>
    readonly input_flagged: FieldRef<"AiInteraction", 'Boolean'>
    readonly output_flagged: FieldRef<"AiInteraction", 'Boolean'>
    readonly crisis_level: FieldRef<"AiInteraction", 'Int'>
    readonly tokens_used: FieldRef<"AiInteraction", 'Int'>
    readonly response_ms: FieldRef<"AiInteraction", 'Int'>
    readonly created_at: FieldRef<"AiInteraction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AiInteraction findUnique
   */
  export type AiInteractionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * Filter, which AiInteraction to fetch.
     */
    where: AiInteractionWhereUniqueInput
  }

  /**
   * AiInteraction findUniqueOrThrow
   */
  export type AiInteractionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * Filter, which AiInteraction to fetch.
     */
    where: AiInteractionWhereUniqueInput
  }

  /**
   * AiInteraction findFirst
   */
  export type AiInteractionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * Filter, which AiInteraction to fetch.
     */
    where?: AiInteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiInteractions to fetch.
     */
    orderBy?: AiInteractionOrderByWithRelationInput | AiInteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AiInteractions.
     */
    cursor?: AiInteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiInteractions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiInteractions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AiInteractions.
     */
    distinct?: AiInteractionScalarFieldEnum | AiInteractionScalarFieldEnum[]
  }

  /**
   * AiInteraction findFirstOrThrow
   */
  export type AiInteractionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * Filter, which AiInteraction to fetch.
     */
    where?: AiInteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiInteractions to fetch.
     */
    orderBy?: AiInteractionOrderByWithRelationInput | AiInteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AiInteractions.
     */
    cursor?: AiInteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiInteractions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiInteractions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AiInteractions.
     */
    distinct?: AiInteractionScalarFieldEnum | AiInteractionScalarFieldEnum[]
  }

  /**
   * AiInteraction findMany
   */
  export type AiInteractionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * Filter, which AiInteractions to fetch.
     */
    where?: AiInteractionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AiInteractions to fetch.
     */
    orderBy?: AiInteractionOrderByWithRelationInput | AiInteractionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AiInteractions.
     */
    cursor?: AiInteractionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AiInteractions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AiInteractions.
     */
    skip?: number
    distinct?: AiInteractionScalarFieldEnum | AiInteractionScalarFieldEnum[]
  }

  /**
   * AiInteraction create
   */
  export type AiInteractionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * The data needed to create a AiInteraction.
     */
    data: XOR<AiInteractionCreateInput, AiInteractionUncheckedCreateInput>
  }

  /**
   * AiInteraction createMany
   */
  export type AiInteractionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AiInteractions.
     */
    data: AiInteractionCreateManyInput | AiInteractionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AiInteraction createManyAndReturn
   */
  export type AiInteractionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * The data used to create many AiInteractions.
     */
    data: AiInteractionCreateManyInput | AiInteractionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AiInteraction update
   */
  export type AiInteractionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * The data needed to update a AiInteraction.
     */
    data: XOR<AiInteractionUpdateInput, AiInteractionUncheckedUpdateInput>
    /**
     * Choose, which AiInteraction to update.
     */
    where: AiInteractionWhereUniqueInput
  }

  /**
   * AiInteraction updateMany
   */
  export type AiInteractionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AiInteractions.
     */
    data: XOR<AiInteractionUpdateManyMutationInput, AiInteractionUncheckedUpdateManyInput>
    /**
     * Filter which AiInteractions to update
     */
    where?: AiInteractionWhereInput
    /**
     * Limit how many AiInteractions to update.
     */
    limit?: number
  }

  /**
   * AiInteraction updateManyAndReturn
   */
  export type AiInteractionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * The data used to update AiInteractions.
     */
    data: XOR<AiInteractionUpdateManyMutationInput, AiInteractionUncheckedUpdateManyInput>
    /**
     * Filter which AiInteractions to update
     */
    where?: AiInteractionWhereInput
    /**
     * Limit how many AiInteractions to update.
     */
    limit?: number
  }

  /**
   * AiInteraction upsert
   */
  export type AiInteractionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * The filter to search for the AiInteraction to update in case it exists.
     */
    where: AiInteractionWhereUniqueInput
    /**
     * In case the AiInteraction found by the `where` argument doesn't exist, create a new AiInteraction with this data.
     */
    create: XOR<AiInteractionCreateInput, AiInteractionUncheckedCreateInput>
    /**
     * In case the AiInteraction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AiInteractionUpdateInput, AiInteractionUncheckedUpdateInput>
  }

  /**
   * AiInteraction delete
   */
  export type AiInteractionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
    /**
     * Filter which AiInteraction to delete.
     */
    where: AiInteractionWhereUniqueInput
  }

  /**
   * AiInteraction deleteMany
   */
  export type AiInteractionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AiInteractions to delete
     */
    where?: AiInteractionWhereInput
    /**
     * Limit how many AiInteractions to delete.
     */
    limit?: number
  }

  /**
   * AiInteraction without action
   */
  export type AiInteractionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AiInteraction
     */
    select?: AiInteractionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AiInteraction
     */
    omit?: AiInteractionOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const AiInteractionScalarFieldEnum: {
    id: 'id',
    user_id: 'user_id',
    session_id: 'session_id',
    user_message: 'user_message',
    ai_response: 'ai_response',
    input_flagged: 'input_flagged',
    output_flagged: 'output_flagged',
    crisis_level: 'crisis_level',
    tokens_used: 'tokens_used',
    response_ms: 'response_ms',
    created_at: 'created_at'
  };

  export type AiInteractionScalarFieldEnum = (typeof AiInteractionScalarFieldEnum)[keyof typeof AiInteractionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type AiInteractionWhereInput = {
    AND?: AiInteractionWhereInput | AiInteractionWhereInput[]
    OR?: AiInteractionWhereInput[]
    NOT?: AiInteractionWhereInput | AiInteractionWhereInput[]
    id?: StringFilter<"AiInteraction"> | string
    user_id?: StringFilter<"AiInteraction"> | string
    session_id?: StringFilter<"AiInteraction"> | string
    user_message?: StringFilter<"AiInteraction"> | string
    ai_response?: StringFilter<"AiInteraction"> | string
    input_flagged?: BoolFilter<"AiInteraction"> | boolean
    output_flagged?: BoolFilter<"AiInteraction"> | boolean
    crisis_level?: IntFilter<"AiInteraction"> | number
    tokens_used?: IntNullableFilter<"AiInteraction"> | number | null
    response_ms?: IntNullableFilter<"AiInteraction"> | number | null
    created_at?: DateTimeFilter<"AiInteraction"> | Date | string
  }

  export type AiInteractionOrderByWithRelationInput = {
    id?: SortOrder
    user_id?: SortOrder
    session_id?: SortOrder
    user_message?: SortOrder
    ai_response?: SortOrder
    input_flagged?: SortOrder
    output_flagged?: SortOrder
    crisis_level?: SortOrder
    tokens_used?: SortOrderInput | SortOrder
    response_ms?: SortOrderInput | SortOrder
    created_at?: SortOrder
  }

  export type AiInteractionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AiInteractionWhereInput | AiInteractionWhereInput[]
    OR?: AiInteractionWhereInput[]
    NOT?: AiInteractionWhereInput | AiInteractionWhereInput[]
    user_id?: StringFilter<"AiInteraction"> | string
    session_id?: StringFilter<"AiInteraction"> | string
    user_message?: StringFilter<"AiInteraction"> | string
    ai_response?: StringFilter<"AiInteraction"> | string
    input_flagged?: BoolFilter<"AiInteraction"> | boolean
    output_flagged?: BoolFilter<"AiInteraction"> | boolean
    crisis_level?: IntFilter<"AiInteraction"> | number
    tokens_used?: IntNullableFilter<"AiInteraction"> | number | null
    response_ms?: IntNullableFilter<"AiInteraction"> | number | null
    created_at?: DateTimeFilter<"AiInteraction"> | Date | string
  }, "id">

  export type AiInteractionOrderByWithAggregationInput = {
    id?: SortOrder
    user_id?: SortOrder
    session_id?: SortOrder
    user_message?: SortOrder
    ai_response?: SortOrder
    input_flagged?: SortOrder
    output_flagged?: SortOrder
    crisis_level?: SortOrder
    tokens_used?: SortOrderInput | SortOrder
    response_ms?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: AiInteractionCountOrderByAggregateInput
    _avg?: AiInteractionAvgOrderByAggregateInput
    _max?: AiInteractionMaxOrderByAggregateInput
    _min?: AiInteractionMinOrderByAggregateInput
    _sum?: AiInteractionSumOrderByAggregateInput
  }

  export type AiInteractionScalarWhereWithAggregatesInput = {
    AND?: AiInteractionScalarWhereWithAggregatesInput | AiInteractionScalarWhereWithAggregatesInput[]
    OR?: AiInteractionScalarWhereWithAggregatesInput[]
    NOT?: AiInteractionScalarWhereWithAggregatesInput | AiInteractionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AiInteraction"> | string
    user_id?: StringWithAggregatesFilter<"AiInteraction"> | string
    session_id?: StringWithAggregatesFilter<"AiInteraction"> | string
    user_message?: StringWithAggregatesFilter<"AiInteraction"> | string
    ai_response?: StringWithAggregatesFilter<"AiInteraction"> | string
    input_flagged?: BoolWithAggregatesFilter<"AiInteraction"> | boolean
    output_flagged?: BoolWithAggregatesFilter<"AiInteraction"> | boolean
    crisis_level?: IntWithAggregatesFilter<"AiInteraction"> | number
    tokens_used?: IntNullableWithAggregatesFilter<"AiInteraction"> | number | null
    response_ms?: IntNullableWithAggregatesFilter<"AiInteraction"> | number | null
    created_at?: DateTimeWithAggregatesFilter<"AiInteraction"> | Date | string
  }

  export type AiInteractionCreateInput = {
    id?: string
    user_id: string
    session_id: string
    user_message: string
    ai_response: string
    input_flagged?: boolean
    output_flagged?: boolean
    crisis_level: number
    tokens_used?: number | null
    response_ms?: number | null
    created_at?: Date | string
  }

  export type AiInteractionUncheckedCreateInput = {
    id?: string
    user_id: string
    session_id: string
    user_message: string
    ai_response: string
    input_flagged?: boolean
    output_flagged?: boolean
    crisis_level: number
    tokens_used?: number | null
    response_ms?: number | null
    created_at?: Date | string
  }

  export type AiInteractionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    session_id?: StringFieldUpdateOperationsInput | string
    user_message?: StringFieldUpdateOperationsInput | string
    ai_response?: StringFieldUpdateOperationsInput | string
    input_flagged?: BoolFieldUpdateOperationsInput | boolean
    output_flagged?: BoolFieldUpdateOperationsInput | boolean
    crisis_level?: IntFieldUpdateOperationsInput | number
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    response_ms?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiInteractionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    session_id?: StringFieldUpdateOperationsInput | string
    user_message?: StringFieldUpdateOperationsInput | string
    ai_response?: StringFieldUpdateOperationsInput | string
    input_flagged?: BoolFieldUpdateOperationsInput | boolean
    output_flagged?: BoolFieldUpdateOperationsInput | boolean
    crisis_level?: IntFieldUpdateOperationsInput | number
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    response_ms?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiInteractionCreateManyInput = {
    id?: string
    user_id: string
    session_id: string
    user_message: string
    ai_response: string
    input_flagged?: boolean
    output_flagged?: boolean
    crisis_level: number
    tokens_used?: number | null
    response_ms?: number | null
    created_at?: Date | string
  }

  export type AiInteractionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    session_id?: StringFieldUpdateOperationsInput | string
    user_message?: StringFieldUpdateOperationsInput | string
    ai_response?: StringFieldUpdateOperationsInput | string
    input_flagged?: BoolFieldUpdateOperationsInput | boolean
    output_flagged?: BoolFieldUpdateOperationsInput | boolean
    crisis_level?: IntFieldUpdateOperationsInput | number
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    response_ms?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AiInteractionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    user_id?: StringFieldUpdateOperationsInput | string
    session_id?: StringFieldUpdateOperationsInput | string
    user_message?: StringFieldUpdateOperationsInput | string
    ai_response?: StringFieldUpdateOperationsInput | string
    input_flagged?: BoolFieldUpdateOperationsInput | boolean
    output_flagged?: BoolFieldUpdateOperationsInput | boolean
    crisis_level?: IntFieldUpdateOperationsInput | number
    tokens_used?: NullableIntFieldUpdateOperationsInput | number | null
    response_ms?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AiInteractionCountOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    session_id?: SortOrder
    user_message?: SortOrder
    ai_response?: SortOrder
    input_flagged?: SortOrder
    output_flagged?: SortOrder
    crisis_level?: SortOrder
    tokens_used?: SortOrder
    response_ms?: SortOrder
    created_at?: SortOrder
  }

  export type AiInteractionAvgOrderByAggregateInput = {
    crisis_level?: SortOrder
    tokens_used?: SortOrder
    response_ms?: SortOrder
  }

  export type AiInteractionMaxOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    session_id?: SortOrder
    user_message?: SortOrder
    ai_response?: SortOrder
    input_flagged?: SortOrder
    output_flagged?: SortOrder
    crisis_level?: SortOrder
    tokens_used?: SortOrder
    response_ms?: SortOrder
    created_at?: SortOrder
  }

  export type AiInteractionMinOrderByAggregateInput = {
    id?: SortOrder
    user_id?: SortOrder
    session_id?: SortOrder
    user_message?: SortOrder
    ai_response?: SortOrder
    input_flagged?: SortOrder
    output_flagged?: SortOrder
    crisis_level?: SortOrder
    tokens_used?: SortOrder
    response_ms?: SortOrder
    created_at?: SortOrder
  }

  export type AiInteractionSumOrderByAggregateInput = {
    crisis_level?: SortOrder
    tokens_used?: SortOrder
    response_ms?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}