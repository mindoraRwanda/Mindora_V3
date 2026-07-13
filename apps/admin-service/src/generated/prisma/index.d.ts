
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
 * Model audit_logs
 * 
 */
export type audit_logs = $Result.DefaultSelection<Prisma.$audit_logsPayload>
/**
 * Model moderation_decisions
 * 
 */
export type moderation_decisions = $Result.DefaultSelection<Prisma.$moderation_decisionsPayload>
/**
 * Model system_alerts
 * 
 */
export type system_alerts = $Result.DefaultSelection<Prisma.$system_alertsPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Audit_logs
 * const audit_logs = await prisma.audit_logs.findMany()
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
   * // Fetch zero or more Audit_logs
   * const audit_logs = await prisma.audit_logs.findMany()
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
   * `prisma.audit_logs`: Exposes CRUD operations for the **audit_logs** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Audit_logs
    * const audit_logs = await prisma.audit_logs.findMany()
    * ```
    */
  get audit_logs(): Prisma.audit_logsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.moderation_decisions`: Exposes CRUD operations for the **moderation_decisions** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Moderation_decisions
    * const moderation_decisions = await prisma.moderation_decisions.findMany()
    * ```
    */
  get moderation_decisions(): Prisma.moderation_decisionsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.system_alerts`: Exposes CRUD operations for the **system_alerts** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more System_alerts
    * const system_alerts = await prisma.system_alerts.findMany()
    * ```
    */
  get system_alerts(): Prisma.system_alertsDelegate<ExtArgs, ClientOptions>;
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
    audit_logs: 'audit_logs',
    moderation_decisions: 'moderation_decisions',
    system_alerts: 'system_alerts'
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
      modelProps: "audit_logs" | "moderation_decisions" | "system_alerts"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      audit_logs: {
        payload: Prisma.$audit_logsPayload<ExtArgs>
        fields: Prisma.audit_logsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.audit_logsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.audit_logsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>
          }
          findFirst: {
            args: Prisma.audit_logsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.audit_logsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>
          }
          findMany: {
            args: Prisma.audit_logsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>[]
          }
          create: {
            args: Prisma.audit_logsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>
          }
          createMany: {
            args: Prisma.audit_logsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.audit_logsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>[]
          }
          delete: {
            args: Prisma.audit_logsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>
          }
          update: {
            args: Prisma.audit_logsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>
          }
          deleteMany: {
            args: Prisma.audit_logsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.audit_logsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.audit_logsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>[]
          }
          upsert: {
            args: Prisma.audit_logsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$audit_logsPayload>
          }
          aggregate: {
            args: Prisma.Audit_logsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAudit_logs>
          }
          groupBy: {
            args: Prisma.audit_logsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Audit_logsGroupByOutputType>[]
          }
          count: {
            args: Prisma.audit_logsCountArgs<ExtArgs>
            result: $Utils.Optional<Audit_logsCountAggregateOutputType> | number
          }
        }
      }
      moderation_decisions: {
        payload: Prisma.$moderation_decisionsPayload<ExtArgs>
        fields: Prisma.moderation_decisionsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.moderation_decisionsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.moderation_decisionsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>
          }
          findFirst: {
            args: Prisma.moderation_decisionsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.moderation_decisionsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>
          }
          findMany: {
            args: Prisma.moderation_decisionsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>[]
          }
          create: {
            args: Prisma.moderation_decisionsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>
          }
          createMany: {
            args: Prisma.moderation_decisionsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.moderation_decisionsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>[]
          }
          delete: {
            args: Prisma.moderation_decisionsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>
          }
          update: {
            args: Prisma.moderation_decisionsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>
          }
          deleteMany: {
            args: Prisma.moderation_decisionsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.moderation_decisionsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.moderation_decisionsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>[]
          }
          upsert: {
            args: Prisma.moderation_decisionsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$moderation_decisionsPayload>
          }
          aggregate: {
            args: Prisma.Moderation_decisionsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModeration_decisions>
          }
          groupBy: {
            args: Prisma.moderation_decisionsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Moderation_decisionsGroupByOutputType>[]
          }
          count: {
            args: Prisma.moderation_decisionsCountArgs<ExtArgs>
            result: $Utils.Optional<Moderation_decisionsCountAggregateOutputType> | number
          }
        }
      }
      system_alerts: {
        payload: Prisma.$system_alertsPayload<ExtArgs>
        fields: Prisma.system_alertsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.system_alertsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.system_alertsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>
          }
          findFirst: {
            args: Prisma.system_alertsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.system_alertsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>
          }
          findMany: {
            args: Prisma.system_alertsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>[]
          }
          create: {
            args: Prisma.system_alertsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>
          }
          createMany: {
            args: Prisma.system_alertsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.system_alertsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>[]
          }
          delete: {
            args: Prisma.system_alertsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>
          }
          update: {
            args: Prisma.system_alertsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>
          }
          deleteMany: {
            args: Prisma.system_alertsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.system_alertsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.system_alertsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>[]
          }
          upsert: {
            args: Prisma.system_alertsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$system_alertsPayload>
          }
          aggregate: {
            args: Prisma.System_alertsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSystem_alerts>
          }
          groupBy: {
            args: Prisma.system_alertsGroupByArgs<ExtArgs>
            result: $Utils.Optional<System_alertsGroupByOutputType>[]
          }
          count: {
            args: Prisma.system_alertsCountArgs<ExtArgs>
            result: $Utils.Optional<System_alertsCountAggregateOutputType> | number
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
    audit_logs?: audit_logsOmit
    moderation_decisions?: moderation_decisionsOmit
    system_alerts?: system_alertsOmit
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
   * Model audit_logs
   */

  export type AggregateAudit_logs = {
    _count: Audit_logsCountAggregateOutputType | null
    _min: Audit_logsMinAggregateOutputType | null
    _max: Audit_logsMaxAggregateOutputType | null
  }

  export type Audit_logsMinAggregateOutputType = {
    id: string | null
    adminId: string | null
    actionType: string | null
    targetId: string | null
    createdAt: Date | null
  }

  export type Audit_logsMaxAggregateOutputType = {
    id: string | null
    adminId: string | null
    actionType: string | null
    targetId: string | null
    createdAt: Date | null
  }

  export type Audit_logsCountAggregateOutputType = {
    id: number
    adminId: number
    actionType: number
    targetId: number
    metadata: number
    createdAt: number
    _all: number
  }


  export type Audit_logsMinAggregateInputType = {
    id?: true
    adminId?: true
    actionType?: true
    targetId?: true
    createdAt?: true
  }

  export type Audit_logsMaxAggregateInputType = {
    id?: true
    adminId?: true
    actionType?: true
    targetId?: true
    createdAt?: true
  }

  export type Audit_logsCountAggregateInputType = {
    id?: true
    adminId?: true
    actionType?: true
    targetId?: true
    metadata?: true
    createdAt?: true
    _all?: true
  }

  export type Audit_logsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which audit_logs to aggregate.
     */
    where?: audit_logsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of audit_logs to fetch.
     */
    orderBy?: audit_logsOrderByWithRelationInput | audit_logsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: audit_logsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` audit_logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` audit_logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned audit_logs
    **/
    _count?: true | Audit_logsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Audit_logsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Audit_logsMaxAggregateInputType
  }

  export type GetAudit_logsAggregateType<T extends Audit_logsAggregateArgs> = {
        [P in keyof T & keyof AggregateAudit_logs]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAudit_logs[P]>
      : GetScalarType<T[P], AggregateAudit_logs[P]>
  }




  export type audit_logsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: audit_logsWhereInput
    orderBy?: audit_logsOrderByWithAggregationInput | audit_logsOrderByWithAggregationInput[]
    by: Audit_logsScalarFieldEnum[] | Audit_logsScalarFieldEnum
    having?: audit_logsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Audit_logsCountAggregateInputType | true
    _min?: Audit_logsMinAggregateInputType
    _max?: Audit_logsMaxAggregateInputType
  }

  export type Audit_logsGroupByOutputType = {
    id: string
    adminId: string
    actionType: string
    targetId: string | null
    metadata: JsonValue | null
    createdAt: Date
    _count: Audit_logsCountAggregateOutputType | null
    _min: Audit_logsMinAggregateOutputType | null
    _max: Audit_logsMaxAggregateOutputType | null
  }

  type GetAudit_logsGroupByPayload<T extends audit_logsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Audit_logsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Audit_logsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Audit_logsGroupByOutputType[P]>
            : GetScalarType<T[P], Audit_logsGroupByOutputType[P]>
        }
      >
    >


  export type audit_logsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    adminId?: boolean
    actionType?: boolean
    targetId?: boolean
    metadata?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["audit_logs"]>

  export type audit_logsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    adminId?: boolean
    actionType?: boolean
    targetId?: boolean
    metadata?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["audit_logs"]>

  export type audit_logsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    adminId?: boolean
    actionType?: boolean
    targetId?: boolean
    metadata?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["audit_logs"]>

  export type audit_logsSelectScalar = {
    id?: boolean
    adminId?: boolean
    actionType?: boolean
    targetId?: boolean
    metadata?: boolean
    createdAt?: boolean
  }

  export type audit_logsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "adminId" | "actionType" | "targetId" | "metadata" | "createdAt", ExtArgs["result"]["audit_logs"]>

  export type $audit_logsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "audit_logs"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      adminId: string
      actionType: string
      targetId: string | null
      metadata: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["audit_logs"]>
    composites: {}
  }

  type audit_logsGetPayload<S extends boolean | null | undefined | audit_logsDefaultArgs> = $Result.GetResult<Prisma.$audit_logsPayload, S>

  type audit_logsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<audit_logsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Audit_logsCountAggregateInputType | true
    }

  export interface audit_logsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['audit_logs'], meta: { name: 'audit_logs' } }
    /**
     * Find zero or one Audit_logs that matches the filter.
     * @param {audit_logsFindUniqueArgs} args - Arguments to find a Audit_logs
     * @example
     * // Get one Audit_logs
     * const audit_logs = await prisma.audit_logs.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends audit_logsFindUniqueArgs>(args: SelectSubset<T, audit_logsFindUniqueArgs<ExtArgs>>): Prisma__audit_logsClient<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Audit_logs that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {audit_logsFindUniqueOrThrowArgs} args - Arguments to find a Audit_logs
     * @example
     * // Get one Audit_logs
     * const audit_logs = await prisma.audit_logs.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends audit_logsFindUniqueOrThrowArgs>(args: SelectSubset<T, audit_logsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__audit_logsClient<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Audit_logs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {audit_logsFindFirstArgs} args - Arguments to find a Audit_logs
     * @example
     * // Get one Audit_logs
     * const audit_logs = await prisma.audit_logs.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends audit_logsFindFirstArgs>(args?: SelectSubset<T, audit_logsFindFirstArgs<ExtArgs>>): Prisma__audit_logsClient<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Audit_logs that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {audit_logsFindFirstOrThrowArgs} args - Arguments to find a Audit_logs
     * @example
     * // Get one Audit_logs
     * const audit_logs = await prisma.audit_logs.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends audit_logsFindFirstOrThrowArgs>(args?: SelectSubset<T, audit_logsFindFirstOrThrowArgs<ExtArgs>>): Prisma__audit_logsClient<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Audit_logs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {audit_logsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Audit_logs
     * const audit_logs = await prisma.audit_logs.findMany()
     * 
     * // Get first 10 Audit_logs
     * const audit_logs = await prisma.audit_logs.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const audit_logsWithIdOnly = await prisma.audit_logs.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends audit_logsFindManyArgs>(args?: SelectSubset<T, audit_logsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Audit_logs.
     * @param {audit_logsCreateArgs} args - Arguments to create a Audit_logs.
     * @example
     * // Create one Audit_logs
     * const Audit_logs = await prisma.audit_logs.create({
     *   data: {
     *     // ... data to create a Audit_logs
     *   }
     * })
     * 
     */
    create<T extends audit_logsCreateArgs>(args: SelectSubset<T, audit_logsCreateArgs<ExtArgs>>): Prisma__audit_logsClient<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Audit_logs.
     * @param {audit_logsCreateManyArgs} args - Arguments to create many Audit_logs.
     * @example
     * // Create many Audit_logs
     * const audit_logs = await prisma.audit_logs.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends audit_logsCreateManyArgs>(args?: SelectSubset<T, audit_logsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Audit_logs and returns the data saved in the database.
     * @param {audit_logsCreateManyAndReturnArgs} args - Arguments to create many Audit_logs.
     * @example
     * // Create many Audit_logs
     * const audit_logs = await prisma.audit_logs.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Audit_logs and only return the `id`
     * const audit_logsWithIdOnly = await prisma.audit_logs.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends audit_logsCreateManyAndReturnArgs>(args?: SelectSubset<T, audit_logsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Audit_logs.
     * @param {audit_logsDeleteArgs} args - Arguments to delete one Audit_logs.
     * @example
     * // Delete one Audit_logs
     * const Audit_logs = await prisma.audit_logs.delete({
     *   where: {
     *     // ... filter to delete one Audit_logs
     *   }
     * })
     * 
     */
    delete<T extends audit_logsDeleteArgs>(args: SelectSubset<T, audit_logsDeleteArgs<ExtArgs>>): Prisma__audit_logsClient<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Audit_logs.
     * @param {audit_logsUpdateArgs} args - Arguments to update one Audit_logs.
     * @example
     * // Update one Audit_logs
     * const audit_logs = await prisma.audit_logs.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends audit_logsUpdateArgs>(args: SelectSubset<T, audit_logsUpdateArgs<ExtArgs>>): Prisma__audit_logsClient<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Audit_logs.
     * @param {audit_logsDeleteManyArgs} args - Arguments to filter Audit_logs to delete.
     * @example
     * // Delete a few Audit_logs
     * const { count } = await prisma.audit_logs.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends audit_logsDeleteManyArgs>(args?: SelectSubset<T, audit_logsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Audit_logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {audit_logsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Audit_logs
     * const audit_logs = await prisma.audit_logs.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends audit_logsUpdateManyArgs>(args: SelectSubset<T, audit_logsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Audit_logs and returns the data updated in the database.
     * @param {audit_logsUpdateManyAndReturnArgs} args - Arguments to update many Audit_logs.
     * @example
     * // Update many Audit_logs
     * const audit_logs = await prisma.audit_logs.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Audit_logs and only return the `id`
     * const audit_logsWithIdOnly = await prisma.audit_logs.updateManyAndReturn({
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
    updateManyAndReturn<T extends audit_logsUpdateManyAndReturnArgs>(args: SelectSubset<T, audit_logsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Audit_logs.
     * @param {audit_logsUpsertArgs} args - Arguments to update or create a Audit_logs.
     * @example
     * // Update or create a Audit_logs
     * const audit_logs = await prisma.audit_logs.upsert({
     *   create: {
     *     // ... data to create a Audit_logs
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Audit_logs we want to update
     *   }
     * })
     */
    upsert<T extends audit_logsUpsertArgs>(args: SelectSubset<T, audit_logsUpsertArgs<ExtArgs>>): Prisma__audit_logsClient<$Result.GetResult<Prisma.$audit_logsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Audit_logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {audit_logsCountArgs} args - Arguments to filter Audit_logs to count.
     * @example
     * // Count the number of Audit_logs
     * const count = await prisma.audit_logs.count({
     *   where: {
     *     // ... the filter for the Audit_logs we want to count
     *   }
     * })
    **/
    count<T extends audit_logsCountArgs>(
      args?: Subset<T, audit_logsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Audit_logsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Audit_logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Audit_logsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends Audit_logsAggregateArgs>(args: Subset<T, Audit_logsAggregateArgs>): Prisma.PrismaPromise<GetAudit_logsAggregateType<T>>

    /**
     * Group by Audit_logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {audit_logsGroupByArgs} args - Group by arguments.
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
      T extends audit_logsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: audit_logsGroupByArgs['orderBy'] }
        : { orderBy?: audit_logsGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, audit_logsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAudit_logsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the audit_logs model
   */
  readonly fields: audit_logsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for audit_logs.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__audit_logsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the audit_logs model
   */
  interface audit_logsFieldRefs {
    readonly id: FieldRef<"audit_logs", 'String'>
    readonly adminId: FieldRef<"audit_logs", 'String'>
    readonly actionType: FieldRef<"audit_logs", 'String'>
    readonly targetId: FieldRef<"audit_logs", 'String'>
    readonly metadata: FieldRef<"audit_logs", 'Json'>
    readonly createdAt: FieldRef<"audit_logs", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * audit_logs findUnique
   */
  export type audit_logsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * Filter, which audit_logs to fetch.
     */
    where: audit_logsWhereUniqueInput
  }

  /**
   * audit_logs findUniqueOrThrow
   */
  export type audit_logsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * Filter, which audit_logs to fetch.
     */
    where: audit_logsWhereUniqueInput
  }

  /**
   * audit_logs findFirst
   */
  export type audit_logsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * Filter, which audit_logs to fetch.
     */
    where?: audit_logsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of audit_logs to fetch.
     */
    orderBy?: audit_logsOrderByWithRelationInput | audit_logsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for audit_logs.
     */
    cursor?: audit_logsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` audit_logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` audit_logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of audit_logs.
     */
    distinct?: Audit_logsScalarFieldEnum | Audit_logsScalarFieldEnum[]
  }

  /**
   * audit_logs findFirstOrThrow
   */
  export type audit_logsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * Filter, which audit_logs to fetch.
     */
    where?: audit_logsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of audit_logs to fetch.
     */
    orderBy?: audit_logsOrderByWithRelationInput | audit_logsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for audit_logs.
     */
    cursor?: audit_logsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` audit_logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` audit_logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of audit_logs.
     */
    distinct?: Audit_logsScalarFieldEnum | Audit_logsScalarFieldEnum[]
  }

  /**
   * audit_logs findMany
   */
  export type audit_logsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * Filter, which audit_logs to fetch.
     */
    where?: audit_logsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of audit_logs to fetch.
     */
    orderBy?: audit_logsOrderByWithRelationInput | audit_logsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing audit_logs.
     */
    cursor?: audit_logsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` audit_logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` audit_logs.
     */
    skip?: number
    distinct?: Audit_logsScalarFieldEnum | Audit_logsScalarFieldEnum[]
  }

  /**
   * audit_logs create
   */
  export type audit_logsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * The data needed to create a audit_logs.
     */
    data: XOR<audit_logsCreateInput, audit_logsUncheckedCreateInput>
  }

  /**
   * audit_logs createMany
   */
  export type audit_logsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many audit_logs.
     */
    data: audit_logsCreateManyInput | audit_logsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * audit_logs createManyAndReturn
   */
  export type audit_logsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * The data used to create many audit_logs.
     */
    data: audit_logsCreateManyInput | audit_logsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * audit_logs update
   */
  export type audit_logsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * The data needed to update a audit_logs.
     */
    data: XOR<audit_logsUpdateInput, audit_logsUncheckedUpdateInput>
    /**
     * Choose, which audit_logs to update.
     */
    where: audit_logsWhereUniqueInput
  }

  /**
   * audit_logs updateMany
   */
  export type audit_logsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update audit_logs.
     */
    data: XOR<audit_logsUpdateManyMutationInput, audit_logsUncheckedUpdateManyInput>
    /**
     * Filter which audit_logs to update
     */
    where?: audit_logsWhereInput
    /**
     * Limit how many audit_logs to update.
     */
    limit?: number
  }

  /**
   * audit_logs updateManyAndReturn
   */
  export type audit_logsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * The data used to update audit_logs.
     */
    data: XOR<audit_logsUpdateManyMutationInput, audit_logsUncheckedUpdateManyInput>
    /**
     * Filter which audit_logs to update
     */
    where?: audit_logsWhereInput
    /**
     * Limit how many audit_logs to update.
     */
    limit?: number
  }

  /**
   * audit_logs upsert
   */
  export type audit_logsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * The filter to search for the audit_logs to update in case it exists.
     */
    where: audit_logsWhereUniqueInput
    /**
     * In case the audit_logs found by the `where` argument doesn't exist, create a new audit_logs with this data.
     */
    create: XOR<audit_logsCreateInput, audit_logsUncheckedCreateInput>
    /**
     * In case the audit_logs was found with the provided `where` argument, update it with this data.
     */
    update: XOR<audit_logsUpdateInput, audit_logsUncheckedUpdateInput>
  }

  /**
   * audit_logs delete
   */
  export type audit_logsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
    /**
     * Filter which audit_logs to delete.
     */
    where: audit_logsWhereUniqueInput
  }

  /**
   * audit_logs deleteMany
   */
  export type audit_logsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which audit_logs to delete
     */
    where?: audit_logsWhereInput
    /**
     * Limit how many audit_logs to delete.
     */
    limit?: number
  }

  /**
   * audit_logs without action
   */
  export type audit_logsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the audit_logs
     */
    select?: audit_logsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the audit_logs
     */
    omit?: audit_logsOmit<ExtArgs> | null
  }


  /**
   * Model moderation_decisions
   */

  export type AggregateModeration_decisions = {
    _count: Moderation_decisionsCountAggregateOutputType | null
    _min: Moderation_decisionsMinAggregateOutputType | null
    _max: Moderation_decisionsMaxAggregateOutputType | null
  }

  export type Moderation_decisionsMinAggregateOutputType = {
    id: string | null
    reportId: string | null
    adminId: string | null
    decision: string | null
    reason: string | null
    createdAt: Date | null
  }

  export type Moderation_decisionsMaxAggregateOutputType = {
    id: string | null
    reportId: string | null
    adminId: string | null
    decision: string | null
    reason: string | null
    createdAt: Date | null
  }

  export type Moderation_decisionsCountAggregateOutputType = {
    id: number
    reportId: number
    adminId: number
    decision: number
    reason: number
    createdAt: number
    _all: number
  }


  export type Moderation_decisionsMinAggregateInputType = {
    id?: true
    reportId?: true
    adminId?: true
    decision?: true
    reason?: true
    createdAt?: true
  }

  export type Moderation_decisionsMaxAggregateInputType = {
    id?: true
    reportId?: true
    adminId?: true
    decision?: true
    reason?: true
    createdAt?: true
  }

  export type Moderation_decisionsCountAggregateInputType = {
    id?: true
    reportId?: true
    adminId?: true
    decision?: true
    reason?: true
    createdAt?: true
    _all?: true
  }

  export type Moderation_decisionsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which moderation_decisions to aggregate.
     */
    where?: moderation_decisionsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of moderation_decisions to fetch.
     */
    orderBy?: moderation_decisionsOrderByWithRelationInput | moderation_decisionsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: moderation_decisionsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` moderation_decisions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` moderation_decisions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned moderation_decisions
    **/
    _count?: true | Moderation_decisionsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Moderation_decisionsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Moderation_decisionsMaxAggregateInputType
  }

  export type GetModeration_decisionsAggregateType<T extends Moderation_decisionsAggregateArgs> = {
        [P in keyof T & keyof AggregateModeration_decisions]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModeration_decisions[P]>
      : GetScalarType<T[P], AggregateModeration_decisions[P]>
  }




  export type moderation_decisionsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: moderation_decisionsWhereInput
    orderBy?: moderation_decisionsOrderByWithAggregationInput | moderation_decisionsOrderByWithAggregationInput[]
    by: Moderation_decisionsScalarFieldEnum[] | Moderation_decisionsScalarFieldEnum
    having?: moderation_decisionsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Moderation_decisionsCountAggregateInputType | true
    _min?: Moderation_decisionsMinAggregateInputType
    _max?: Moderation_decisionsMaxAggregateInputType
  }

  export type Moderation_decisionsGroupByOutputType = {
    id: string
    reportId: string
    adminId: string
    decision: string
    reason: string
    createdAt: Date
    _count: Moderation_decisionsCountAggregateOutputType | null
    _min: Moderation_decisionsMinAggregateOutputType | null
    _max: Moderation_decisionsMaxAggregateOutputType | null
  }

  type GetModeration_decisionsGroupByPayload<T extends moderation_decisionsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Moderation_decisionsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Moderation_decisionsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Moderation_decisionsGroupByOutputType[P]>
            : GetScalarType<T[P], Moderation_decisionsGroupByOutputType[P]>
        }
      >
    >


  export type moderation_decisionsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    reportId?: boolean
    adminId?: boolean
    decision?: boolean
    reason?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["moderation_decisions"]>

  export type moderation_decisionsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    reportId?: boolean
    adminId?: boolean
    decision?: boolean
    reason?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["moderation_decisions"]>

  export type moderation_decisionsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    reportId?: boolean
    adminId?: boolean
    decision?: boolean
    reason?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["moderation_decisions"]>

  export type moderation_decisionsSelectScalar = {
    id?: boolean
    reportId?: boolean
    adminId?: boolean
    decision?: boolean
    reason?: boolean
    createdAt?: boolean
  }

  export type moderation_decisionsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "reportId" | "adminId" | "decision" | "reason" | "createdAt", ExtArgs["result"]["moderation_decisions"]>

  export type $moderation_decisionsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "moderation_decisions"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      reportId: string
      adminId: string
      decision: string
      reason: string
      createdAt: Date
    }, ExtArgs["result"]["moderation_decisions"]>
    composites: {}
  }

  type moderation_decisionsGetPayload<S extends boolean | null | undefined | moderation_decisionsDefaultArgs> = $Result.GetResult<Prisma.$moderation_decisionsPayload, S>

  type moderation_decisionsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<moderation_decisionsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Moderation_decisionsCountAggregateInputType | true
    }

  export interface moderation_decisionsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['moderation_decisions'], meta: { name: 'moderation_decisions' } }
    /**
     * Find zero or one Moderation_decisions that matches the filter.
     * @param {moderation_decisionsFindUniqueArgs} args - Arguments to find a Moderation_decisions
     * @example
     * // Get one Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends moderation_decisionsFindUniqueArgs>(args: SelectSubset<T, moderation_decisionsFindUniqueArgs<ExtArgs>>): Prisma__moderation_decisionsClient<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Moderation_decisions that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {moderation_decisionsFindUniqueOrThrowArgs} args - Arguments to find a Moderation_decisions
     * @example
     * // Get one Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends moderation_decisionsFindUniqueOrThrowArgs>(args: SelectSubset<T, moderation_decisionsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__moderation_decisionsClient<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Moderation_decisions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {moderation_decisionsFindFirstArgs} args - Arguments to find a Moderation_decisions
     * @example
     * // Get one Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends moderation_decisionsFindFirstArgs>(args?: SelectSubset<T, moderation_decisionsFindFirstArgs<ExtArgs>>): Prisma__moderation_decisionsClient<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Moderation_decisions that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {moderation_decisionsFindFirstOrThrowArgs} args - Arguments to find a Moderation_decisions
     * @example
     * // Get one Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends moderation_decisionsFindFirstOrThrowArgs>(args?: SelectSubset<T, moderation_decisionsFindFirstOrThrowArgs<ExtArgs>>): Prisma__moderation_decisionsClient<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Moderation_decisions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {moderation_decisionsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.findMany()
     * 
     * // Get first 10 Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const moderation_decisionsWithIdOnly = await prisma.moderation_decisions.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends moderation_decisionsFindManyArgs>(args?: SelectSubset<T, moderation_decisionsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Moderation_decisions.
     * @param {moderation_decisionsCreateArgs} args - Arguments to create a Moderation_decisions.
     * @example
     * // Create one Moderation_decisions
     * const Moderation_decisions = await prisma.moderation_decisions.create({
     *   data: {
     *     // ... data to create a Moderation_decisions
     *   }
     * })
     * 
     */
    create<T extends moderation_decisionsCreateArgs>(args: SelectSubset<T, moderation_decisionsCreateArgs<ExtArgs>>): Prisma__moderation_decisionsClient<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Moderation_decisions.
     * @param {moderation_decisionsCreateManyArgs} args - Arguments to create many Moderation_decisions.
     * @example
     * // Create many Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends moderation_decisionsCreateManyArgs>(args?: SelectSubset<T, moderation_decisionsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Moderation_decisions and returns the data saved in the database.
     * @param {moderation_decisionsCreateManyAndReturnArgs} args - Arguments to create many Moderation_decisions.
     * @example
     * // Create many Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Moderation_decisions and only return the `id`
     * const moderation_decisionsWithIdOnly = await prisma.moderation_decisions.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends moderation_decisionsCreateManyAndReturnArgs>(args?: SelectSubset<T, moderation_decisionsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Moderation_decisions.
     * @param {moderation_decisionsDeleteArgs} args - Arguments to delete one Moderation_decisions.
     * @example
     * // Delete one Moderation_decisions
     * const Moderation_decisions = await prisma.moderation_decisions.delete({
     *   where: {
     *     // ... filter to delete one Moderation_decisions
     *   }
     * })
     * 
     */
    delete<T extends moderation_decisionsDeleteArgs>(args: SelectSubset<T, moderation_decisionsDeleteArgs<ExtArgs>>): Prisma__moderation_decisionsClient<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Moderation_decisions.
     * @param {moderation_decisionsUpdateArgs} args - Arguments to update one Moderation_decisions.
     * @example
     * // Update one Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends moderation_decisionsUpdateArgs>(args: SelectSubset<T, moderation_decisionsUpdateArgs<ExtArgs>>): Prisma__moderation_decisionsClient<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Moderation_decisions.
     * @param {moderation_decisionsDeleteManyArgs} args - Arguments to filter Moderation_decisions to delete.
     * @example
     * // Delete a few Moderation_decisions
     * const { count } = await prisma.moderation_decisions.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends moderation_decisionsDeleteManyArgs>(args?: SelectSubset<T, moderation_decisionsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Moderation_decisions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {moderation_decisionsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends moderation_decisionsUpdateManyArgs>(args: SelectSubset<T, moderation_decisionsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Moderation_decisions and returns the data updated in the database.
     * @param {moderation_decisionsUpdateManyAndReturnArgs} args - Arguments to update many Moderation_decisions.
     * @example
     * // Update many Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Moderation_decisions and only return the `id`
     * const moderation_decisionsWithIdOnly = await prisma.moderation_decisions.updateManyAndReturn({
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
    updateManyAndReturn<T extends moderation_decisionsUpdateManyAndReturnArgs>(args: SelectSubset<T, moderation_decisionsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Moderation_decisions.
     * @param {moderation_decisionsUpsertArgs} args - Arguments to update or create a Moderation_decisions.
     * @example
     * // Update or create a Moderation_decisions
     * const moderation_decisions = await prisma.moderation_decisions.upsert({
     *   create: {
     *     // ... data to create a Moderation_decisions
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Moderation_decisions we want to update
     *   }
     * })
     */
    upsert<T extends moderation_decisionsUpsertArgs>(args: SelectSubset<T, moderation_decisionsUpsertArgs<ExtArgs>>): Prisma__moderation_decisionsClient<$Result.GetResult<Prisma.$moderation_decisionsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Moderation_decisions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {moderation_decisionsCountArgs} args - Arguments to filter Moderation_decisions to count.
     * @example
     * // Count the number of Moderation_decisions
     * const count = await prisma.moderation_decisions.count({
     *   where: {
     *     // ... the filter for the Moderation_decisions we want to count
     *   }
     * })
    **/
    count<T extends moderation_decisionsCountArgs>(
      args?: Subset<T, moderation_decisionsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Moderation_decisionsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Moderation_decisions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Moderation_decisionsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends Moderation_decisionsAggregateArgs>(args: Subset<T, Moderation_decisionsAggregateArgs>): Prisma.PrismaPromise<GetModeration_decisionsAggregateType<T>>

    /**
     * Group by Moderation_decisions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {moderation_decisionsGroupByArgs} args - Group by arguments.
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
      T extends moderation_decisionsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: moderation_decisionsGroupByArgs['orderBy'] }
        : { orderBy?: moderation_decisionsGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, moderation_decisionsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModeration_decisionsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the moderation_decisions model
   */
  readonly fields: moderation_decisionsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for moderation_decisions.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__moderation_decisionsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the moderation_decisions model
   */
  interface moderation_decisionsFieldRefs {
    readonly id: FieldRef<"moderation_decisions", 'String'>
    readonly reportId: FieldRef<"moderation_decisions", 'String'>
    readonly adminId: FieldRef<"moderation_decisions", 'String'>
    readonly decision: FieldRef<"moderation_decisions", 'String'>
    readonly reason: FieldRef<"moderation_decisions", 'String'>
    readonly createdAt: FieldRef<"moderation_decisions", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * moderation_decisions findUnique
   */
  export type moderation_decisionsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * Filter, which moderation_decisions to fetch.
     */
    where: moderation_decisionsWhereUniqueInput
  }

  /**
   * moderation_decisions findUniqueOrThrow
   */
  export type moderation_decisionsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * Filter, which moderation_decisions to fetch.
     */
    where: moderation_decisionsWhereUniqueInput
  }

  /**
   * moderation_decisions findFirst
   */
  export type moderation_decisionsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * Filter, which moderation_decisions to fetch.
     */
    where?: moderation_decisionsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of moderation_decisions to fetch.
     */
    orderBy?: moderation_decisionsOrderByWithRelationInput | moderation_decisionsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for moderation_decisions.
     */
    cursor?: moderation_decisionsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` moderation_decisions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` moderation_decisions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of moderation_decisions.
     */
    distinct?: Moderation_decisionsScalarFieldEnum | Moderation_decisionsScalarFieldEnum[]
  }

  /**
   * moderation_decisions findFirstOrThrow
   */
  export type moderation_decisionsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * Filter, which moderation_decisions to fetch.
     */
    where?: moderation_decisionsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of moderation_decisions to fetch.
     */
    orderBy?: moderation_decisionsOrderByWithRelationInput | moderation_decisionsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for moderation_decisions.
     */
    cursor?: moderation_decisionsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` moderation_decisions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` moderation_decisions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of moderation_decisions.
     */
    distinct?: Moderation_decisionsScalarFieldEnum | Moderation_decisionsScalarFieldEnum[]
  }

  /**
   * moderation_decisions findMany
   */
  export type moderation_decisionsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * Filter, which moderation_decisions to fetch.
     */
    where?: moderation_decisionsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of moderation_decisions to fetch.
     */
    orderBy?: moderation_decisionsOrderByWithRelationInput | moderation_decisionsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing moderation_decisions.
     */
    cursor?: moderation_decisionsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` moderation_decisions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` moderation_decisions.
     */
    skip?: number
    distinct?: Moderation_decisionsScalarFieldEnum | Moderation_decisionsScalarFieldEnum[]
  }

  /**
   * moderation_decisions create
   */
  export type moderation_decisionsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * The data needed to create a moderation_decisions.
     */
    data: XOR<moderation_decisionsCreateInput, moderation_decisionsUncheckedCreateInput>
  }

  /**
   * moderation_decisions createMany
   */
  export type moderation_decisionsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many moderation_decisions.
     */
    data: moderation_decisionsCreateManyInput | moderation_decisionsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * moderation_decisions createManyAndReturn
   */
  export type moderation_decisionsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * The data used to create many moderation_decisions.
     */
    data: moderation_decisionsCreateManyInput | moderation_decisionsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * moderation_decisions update
   */
  export type moderation_decisionsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * The data needed to update a moderation_decisions.
     */
    data: XOR<moderation_decisionsUpdateInput, moderation_decisionsUncheckedUpdateInput>
    /**
     * Choose, which moderation_decisions to update.
     */
    where: moderation_decisionsWhereUniqueInput
  }

  /**
   * moderation_decisions updateMany
   */
  export type moderation_decisionsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update moderation_decisions.
     */
    data: XOR<moderation_decisionsUpdateManyMutationInput, moderation_decisionsUncheckedUpdateManyInput>
    /**
     * Filter which moderation_decisions to update
     */
    where?: moderation_decisionsWhereInput
    /**
     * Limit how many moderation_decisions to update.
     */
    limit?: number
  }

  /**
   * moderation_decisions updateManyAndReturn
   */
  export type moderation_decisionsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * The data used to update moderation_decisions.
     */
    data: XOR<moderation_decisionsUpdateManyMutationInput, moderation_decisionsUncheckedUpdateManyInput>
    /**
     * Filter which moderation_decisions to update
     */
    where?: moderation_decisionsWhereInput
    /**
     * Limit how many moderation_decisions to update.
     */
    limit?: number
  }

  /**
   * moderation_decisions upsert
   */
  export type moderation_decisionsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * The filter to search for the moderation_decisions to update in case it exists.
     */
    where: moderation_decisionsWhereUniqueInput
    /**
     * In case the moderation_decisions found by the `where` argument doesn't exist, create a new moderation_decisions with this data.
     */
    create: XOR<moderation_decisionsCreateInput, moderation_decisionsUncheckedCreateInput>
    /**
     * In case the moderation_decisions was found with the provided `where` argument, update it with this data.
     */
    update: XOR<moderation_decisionsUpdateInput, moderation_decisionsUncheckedUpdateInput>
  }

  /**
   * moderation_decisions delete
   */
  export type moderation_decisionsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
    /**
     * Filter which moderation_decisions to delete.
     */
    where: moderation_decisionsWhereUniqueInput
  }

  /**
   * moderation_decisions deleteMany
   */
  export type moderation_decisionsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which moderation_decisions to delete
     */
    where?: moderation_decisionsWhereInput
    /**
     * Limit how many moderation_decisions to delete.
     */
    limit?: number
  }

  /**
   * moderation_decisions without action
   */
  export type moderation_decisionsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the moderation_decisions
     */
    select?: moderation_decisionsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the moderation_decisions
     */
    omit?: moderation_decisionsOmit<ExtArgs> | null
  }


  /**
   * Model system_alerts
   */

  export type AggregateSystem_alerts = {
    _count: System_alertsCountAggregateOutputType | null
    _min: System_alertsMinAggregateOutputType | null
    _max: System_alertsMaxAggregateOutputType | null
  }

  export type System_alertsMinAggregateOutputType = {
    id: string | null
    eventType: string | null
    severity: string | null
    resolved: boolean | null
    createdAt: Date | null
  }

  export type System_alertsMaxAggregateOutputType = {
    id: string | null
    eventType: string | null
    severity: string | null
    resolved: boolean | null
    createdAt: Date | null
  }

  export type System_alertsCountAggregateOutputType = {
    id: number
    eventType: number
    severity: number
    payload: number
    resolved: number
    createdAt: number
    _all: number
  }


  export type System_alertsMinAggregateInputType = {
    id?: true
    eventType?: true
    severity?: true
    resolved?: true
    createdAt?: true
  }

  export type System_alertsMaxAggregateInputType = {
    id?: true
    eventType?: true
    severity?: true
    resolved?: true
    createdAt?: true
  }

  export type System_alertsCountAggregateInputType = {
    id?: true
    eventType?: true
    severity?: true
    payload?: true
    resolved?: true
    createdAt?: true
    _all?: true
  }

  export type System_alertsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which system_alerts to aggregate.
     */
    where?: system_alertsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of system_alerts to fetch.
     */
    orderBy?: system_alertsOrderByWithRelationInput | system_alertsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: system_alertsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` system_alerts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` system_alerts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned system_alerts
    **/
    _count?: true | System_alertsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: System_alertsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: System_alertsMaxAggregateInputType
  }

  export type GetSystem_alertsAggregateType<T extends System_alertsAggregateArgs> = {
        [P in keyof T & keyof AggregateSystem_alerts]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSystem_alerts[P]>
      : GetScalarType<T[P], AggregateSystem_alerts[P]>
  }




  export type system_alertsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: system_alertsWhereInput
    orderBy?: system_alertsOrderByWithAggregationInput | system_alertsOrderByWithAggregationInput[]
    by: System_alertsScalarFieldEnum[] | System_alertsScalarFieldEnum
    having?: system_alertsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: System_alertsCountAggregateInputType | true
    _min?: System_alertsMinAggregateInputType
    _max?: System_alertsMaxAggregateInputType
  }

  export type System_alertsGroupByOutputType = {
    id: string
    eventType: string
    severity: string
    payload: JsonValue
    resolved: boolean
    createdAt: Date
    _count: System_alertsCountAggregateOutputType | null
    _min: System_alertsMinAggregateOutputType | null
    _max: System_alertsMaxAggregateOutputType | null
  }

  type GetSystem_alertsGroupByPayload<T extends system_alertsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<System_alertsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof System_alertsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], System_alertsGroupByOutputType[P]>
            : GetScalarType<T[P], System_alertsGroupByOutputType[P]>
        }
      >
    >


  export type system_alertsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    severity?: boolean
    payload?: boolean
    resolved?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["system_alerts"]>

  export type system_alertsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    severity?: boolean
    payload?: boolean
    resolved?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["system_alerts"]>

  export type system_alertsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    severity?: boolean
    payload?: boolean
    resolved?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["system_alerts"]>

  export type system_alertsSelectScalar = {
    id?: boolean
    eventType?: boolean
    severity?: boolean
    payload?: boolean
    resolved?: boolean
    createdAt?: boolean
  }

  export type system_alertsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventType" | "severity" | "payload" | "resolved" | "createdAt", ExtArgs["result"]["system_alerts"]>

  export type $system_alertsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "system_alerts"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventType: string
      severity: string
      payload: Prisma.JsonValue
      resolved: boolean
      createdAt: Date
    }, ExtArgs["result"]["system_alerts"]>
    composites: {}
  }

  type system_alertsGetPayload<S extends boolean | null | undefined | system_alertsDefaultArgs> = $Result.GetResult<Prisma.$system_alertsPayload, S>

  type system_alertsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<system_alertsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: System_alertsCountAggregateInputType | true
    }

  export interface system_alertsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['system_alerts'], meta: { name: 'system_alerts' } }
    /**
     * Find zero or one System_alerts that matches the filter.
     * @param {system_alertsFindUniqueArgs} args - Arguments to find a System_alerts
     * @example
     * // Get one System_alerts
     * const system_alerts = await prisma.system_alerts.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends system_alertsFindUniqueArgs>(args: SelectSubset<T, system_alertsFindUniqueArgs<ExtArgs>>): Prisma__system_alertsClient<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one System_alerts that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {system_alertsFindUniqueOrThrowArgs} args - Arguments to find a System_alerts
     * @example
     * // Get one System_alerts
     * const system_alerts = await prisma.system_alerts.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends system_alertsFindUniqueOrThrowArgs>(args: SelectSubset<T, system_alertsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__system_alertsClient<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first System_alerts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {system_alertsFindFirstArgs} args - Arguments to find a System_alerts
     * @example
     * // Get one System_alerts
     * const system_alerts = await prisma.system_alerts.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends system_alertsFindFirstArgs>(args?: SelectSubset<T, system_alertsFindFirstArgs<ExtArgs>>): Prisma__system_alertsClient<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first System_alerts that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {system_alertsFindFirstOrThrowArgs} args - Arguments to find a System_alerts
     * @example
     * // Get one System_alerts
     * const system_alerts = await prisma.system_alerts.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends system_alertsFindFirstOrThrowArgs>(args?: SelectSubset<T, system_alertsFindFirstOrThrowArgs<ExtArgs>>): Prisma__system_alertsClient<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more System_alerts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {system_alertsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all System_alerts
     * const system_alerts = await prisma.system_alerts.findMany()
     * 
     * // Get first 10 System_alerts
     * const system_alerts = await prisma.system_alerts.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const system_alertsWithIdOnly = await prisma.system_alerts.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends system_alertsFindManyArgs>(args?: SelectSubset<T, system_alertsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a System_alerts.
     * @param {system_alertsCreateArgs} args - Arguments to create a System_alerts.
     * @example
     * // Create one System_alerts
     * const System_alerts = await prisma.system_alerts.create({
     *   data: {
     *     // ... data to create a System_alerts
     *   }
     * })
     * 
     */
    create<T extends system_alertsCreateArgs>(args: SelectSubset<T, system_alertsCreateArgs<ExtArgs>>): Prisma__system_alertsClient<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many System_alerts.
     * @param {system_alertsCreateManyArgs} args - Arguments to create many System_alerts.
     * @example
     * // Create many System_alerts
     * const system_alerts = await prisma.system_alerts.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends system_alertsCreateManyArgs>(args?: SelectSubset<T, system_alertsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many System_alerts and returns the data saved in the database.
     * @param {system_alertsCreateManyAndReturnArgs} args - Arguments to create many System_alerts.
     * @example
     * // Create many System_alerts
     * const system_alerts = await prisma.system_alerts.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many System_alerts and only return the `id`
     * const system_alertsWithIdOnly = await prisma.system_alerts.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends system_alertsCreateManyAndReturnArgs>(args?: SelectSubset<T, system_alertsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a System_alerts.
     * @param {system_alertsDeleteArgs} args - Arguments to delete one System_alerts.
     * @example
     * // Delete one System_alerts
     * const System_alerts = await prisma.system_alerts.delete({
     *   where: {
     *     // ... filter to delete one System_alerts
     *   }
     * })
     * 
     */
    delete<T extends system_alertsDeleteArgs>(args: SelectSubset<T, system_alertsDeleteArgs<ExtArgs>>): Prisma__system_alertsClient<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one System_alerts.
     * @param {system_alertsUpdateArgs} args - Arguments to update one System_alerts.
     * @example
     * // Update one System_alerts
     * const system_alerts = await prisma.system_alerts.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends system_alertsUpdateArgs>(args: SelectSubset<T, system_alertsUpdateArgs<ExtArgs>>): Prisma__system_alertsClient<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more System_alerts.
     * @param {system_alertsDeleteManyArgs} args - Arguments to filter System_alerts to delete.
     * @example
     * // Delete a few System_alerts
     * const { count } = await prisma.system_alerts.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends system_alertsDeleteManyArgs>(args?: SelectSubset<T, system_alertsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more System_alerts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {system_alertsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many System_alerts
     * const system_alerts = await prisma.system_alerts.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends system_alertsUpdateManyArgs>(args: SelectSubset<T, system_alertsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more System_alerts and returns the data updated in the database.
     * @param {system_alertsUpdateManyAndReturnArgs} args - Arguments to update many System_alerts.
     * @example
     * // Update many System_alerts
     * const system_alerts = await prisma.system_alerts.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more System_alerts and only return the `id`
     * const system_alertsWithIdOnly = await prisma.system_alerts.updateManyAndReturn({
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
    updateManyAndReturn<T extends system_alertsUpdateManyAndReturnArgs>(args: SelectSubset<T, system_alertsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one System_alerts.
     * @param {system_alertsUpsertArgs} args - Arguments to update or create a System_alerts.
     * @example
     * // Update or create a System_alerts
     * const system_alerts = await prisma.system_alerts.upsert({
     *   create: {
     *     // ... data to create a System_alerts
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the System_alerts we want to update
     *   }
     * })
     */
    upsert<T extends system_alertsUpsertArgs>(args: SelectSubset<T, system_alertsUpsertArgs<ExtArgs>>): Prisma__system_alertsClient<$Result.GetResult<Prisma.$system_alertsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of System_alerts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {system_alertsCountArgs} args - Arguments to filter System_alerts to count.
     * @example
     * // Count the number of System_alerts
     * const count = await prisma.system_alerts.count({
     *   where: {
     *     // ... the filter for the System_alerts we want to count
     *   }
     * })
    **/
    count<T extends system_alertsCountArgs>(
      args?: Subset<T, system_alertsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], System_alertsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a System_alerts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {System_alertsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends System_alertsAggregateArgs>(args: Subset<T, System_alertsAggregateArgs>): Prisma.PrismaPromise<GetSystem_alertsAggregateType<T>>

    /**
     * Group by System_alerts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {system_alertsGroupByArgs} args - Group by arguments.
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
      T extends system_alertsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: system_alertsGroupByArgs['orderBy'] }
        : { orderBy?: system_alertsGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, system_alertsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSystem_alertsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the system_alerts model
   */
  readonly fields: system_alertsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for system_alerts.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__system_alertsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the system_alerts model
   */
  interface system_alertsFieldRefs {
    readonly id: FieldRef<"system_alerts", 'String'>
    readonly eventType: FieldRef<"system_alerts", 'String'>
    readonly severity: FieldRef<"system_alerts", 'String'>
    readonly payload: FieldRef<"system_alerts", 'Json'>
    readonly resolved: FieldRef<"system_alerts", 'Boolean'>
    readonly createdAt: FieldRef<"system_alerts", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * system_alerts findUnique
   */
  export type system_alertsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * Filter, which system_alerts to fetch.
     */
    where: system_alertsWhereUniqueInput
  }

  /**
   * system_alerts findUniqueOrThrow
   */
  export type system_alertsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * Filter, which system_alerts to fetch.
     */
    where: system_alertsWhereUniqueInput
  }

  /**
   * system_alerts findFirst
   */
  export type system_alertsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * Filter, which system_alerts to fetch.
     */
    where?: system_alertsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of system_alerts to fetch.
     */
    orderBy?: system_alertsOrderByWithRelationInput | system_alertsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for system_alerts.
     */
    cursor?: system_alertsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` system_alerts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` system_alerts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of system_alerts.
     */
    distinct?: System_alertsScalarFieldEnum | System_alertsScalarFieldEnum[]
  }

  /**
   * system_alerts findFirstOrThrow
   */
  export type system_alertsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * Filter, which system_alerts to fetch.
     */
    where?: system_alertsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of system_alerts to fetch.
     */
    orderBy?: system_alertsOrderByWithRelationInput | system_alertsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for system_alerts.
     */
    cursor?: system_alertsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` system_alerts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` system_alerts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of system_alerts.
     */
    distinct?: System_alertsScalarFieldEnum | System_alertsScalarFieldEnum[]
  }

  /**
   * system_alerts findMany
   */
  export type system_alertsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * Filter, which system_alerts to fetch.
     */
    where?: system_alertsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of system_alerts to fetch.
     */
    orderBy?: system_alertsOrderByWithRelationInput | system_alertsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing system_alerts.
     */
    cursor?: system_alertsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` system_alerts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` system_alerts.
     */
    skip?: number
    distinct?: System_alertsScalarFieldEnum | System_alertsScalarFieldEnum[]
  }

  /**
   * system_alerts create
   */
  export type system_alertsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * The data needed to create a system_alerts.
     */
    data: XOR<system_alertsCreateInput, system_alertsUncheckedCreateInput>
  }

  /**
   * system_alerts createMany
   */
  export type system_alertsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many system_alerts.
     */
    data: system_alertsCreateManyInput | system_alertsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * system_alerts createManyAndReturn
   */
  export type system_alertsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * The data used to create many system_alerts.
     */
    data: system_alertsCreateManyInput | system_alertsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * system_alerts update
   */
  export type system_alertsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * The data needed to update a system_alerts.
     */
    data: XOR<system_alertsUpdateInput, system_alertsUncheckedUpdateInput>
    /**
     * Choose, which system_alerts to update.
     */
    where: system_alertsWhereUniqueInput
  }

  /**
   * system_alerts updateMany
   */
  export type system_alertsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update system_alerts.
     */
    data: XOR<system_alertsUpdateManyMutationInput, system_alertsUncheckedUpdateManyInput>
    /**
     * Filter which system_alerts to update
     */
    where?: system_alertsWhereInput
    /**
     * Limit how many system_alerts to update.
     */
    limit?: number
  }

  /**
   * system_alerts updateManyAndReturn
   */
  export type system_alertsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * The data used to update system_alerts.
     */
    data: XOR<system_alertsUpdateManyMutationInput, system_alertsUncheckedUpdateManyInput>
    /**
     * Filter which system_alerts to update
     */
    where?: system_alertsWhereInput
    /**
     * Limit how many system_alerts to update.
     */
    limit?: number
  }

  /**
   * system_alerts upsert
   */
  export type system_alertsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * The filter to search for the system_alerts to update in case it exists.
     */
    where: system_alertsWhereUniqueInput
    /**
     * In case the system_alerts found by the `where` argument doesn't exist, create a new system_alerts with this data.
     */
    create: XOR<system_alertsCreateInput, system_alertsUncheckedCreateInput>
    /**
     * In case the system_alerts was found with the provided `where` argument, update it with this data.
     */
    update: XOR<system_alertsUpdateInput, system_alertsUncheckedUpdateInput>
  }

  /**
   * system_alerts delete
   */
  export type system_alertsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
    /**
     * Filter which system_alerts to delete.
     */
    where: system_alertsWhereUniqueInput
  }

  /**
   * system_alerts deleteMany
   */
  export type system_alertsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which system_alerts to delete
     */
    where?: system_alertsWhereInput
    /**
     * Limit how many system_alerts to delete.
     */
    limit?: number
  }

  /**
   * system_alerts without action
   */
  export type system_alertsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the system_alerts
     */
    select?: system_alertsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the system_alerts
     */
    omit?: system_alertsOmit<ExtArgs> | null
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


  export const Audit_logsScalarFieldEnum: {
    id: 'id',
    adminId: 'adminId',
    actionType: 'actionType',
    targetId: 'targetId',
    metadata: 'metadata',
    createdAt: 'createdAt'
  };

  export type Audit_logsScalarFieldEnum = (typeof Audit_logsScalarFieldEnum)[keyof typeof Audit_logsScalarFieldEnum]


  export const Moderation_decisionsScalarFieldEnum: {
    id: 'id',
    reportId: 'reportId',
    adminId: 'adminId',
    decision: 'decision',
    reason: 'reason',
    createdAt: 'createdAt'
  };

  export type Moderation_decisionsScalarFieldEnum = (typeof Moderation_decisionsScalarFieldEnum)[keyof typeof Moderation_decisionsScalarFieldEnum]


  export const System_alertsScalarFieldEnum: {
    id: 'id',
    eventType: 'eventType',
    severity: 'severity',
    payload: 'payload',
    resolved: 'resolved',
    createdAt: 'createdAt'
  };

  export type System_alertsScalarFieldEnum = (typeof System_alertsScalarFieldEnum)[keyof typeof System_alertsScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


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
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


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
   * Deep Input Types
   */


  export type audit_logsWhereInput = {
    AND?: audit_logsWhereInput | audit_logsWhereInput[]
    OR?: audit_logsWhereInput[]
    NOT?: audit_logsWhereInput | audit_logsWhereInput[]
    id?: StringFilter<"audit_logs"> | string
    adminId?: StringFilter<"audit_logs"> | string
    actionType?: StringFilter<"audit_logs"> | string
    targetId?: StringNullableFilter<"audit_logs"> | string | null
    metadata?: JsonNullableFilter<"audit_logs">
    createdAt?: DateTimeFilter<"audit_logs"> | Date | string
  }

  export type audit_logsOrderByWithRelationInput = {
    id?: SortOrder
    adminId?: SortOrder
    actionType?: SortOrder
    targetId?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type audit_logsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: audit_logsWhereInput | audit_logsWhereInput[]
    OR?: audit_logsWhereInput[]
    NOT?: audit_logsWhereInput | audit_logsWhereInput[]
    adminId?: StringFilter<"audit_logs"> | string
    actionType?: StringFilter<"audit_logs"> | string
    targetId?: StringNullableFilter<"audit_logs"> | string | null
    metadata?: JsonNullableFilter<"audit_logs">
    createdAt?: DateTimeFilter<"audit_logs"> | Date | string
  }, "id">

  export type audit_logsOrderByWithAggregationInput = {
    id?: SortOrder
    adminId?: SortOrder
    actionType?: SortOrder
    targetId?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: audit_logsCountOrderByAggregateInput
    _max?: audit_logsMaxOrderByAggregateInput
    _min?: audit_logsMinOrderByAggregateInput
  }

  export type audit_logsScalarWhereWithAggregatesInput = {
    AND?: audit_logsScalarWhereWithAggregatesInput | audit_logsScalarWhereWithAggregatesInput[]
    OR?: audit_logsScalarWhereWithAggregatesInput[]
    NOT?: audit_logsScalarWhereWithAggregatesInput | audit_logsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"audit_logs"> | string
    adminId?: StringWithAggregatesFilter<"audit_logs"> | string
    actionType?: StringWithAggregatesFilter<"audit_logs"> | string
    targetId?: StringNullableWithAggregatesFilter<"audit_logs"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"audit_logs">
    createdAt?: DateTimeWithAggregatesFilter<"audit_logs"> | Date | string
  }

  export type moderation_decisionsWhereInput = {
    AND?: moderation_decisionsWhereInput | moderation_decisionsWhereInput[]
    OR?: moderation_decisionsWhereInput[]
    NOT?: moderation_decisionsWhereInput | moderation_decisionsWhereInput[]
    id?: StringFilter<"moderation_decisions"> | string
    reportId?: StringFilter<"moderation_decisions"> | string
    adminId?: StringFilter<"moderation_decisions"> | string
    decision?: StringFilter<"moderation_decisions"> | string
    reason?: StringFilter<"moderation_decisions"> | string
    createdAt?: DateTimeFilter<"moderation_decisions"> | Date | string
  }

  export type moderation_decisionsOrderByWithRelationInput = {
    id?: SortOrder
    reportId?: SortOrder
    adminId?: SortOrder
    decision?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type moderation_decisionsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: moderation_decisionsWhereInput | moderation_decisionsWhereInput[]
    OR?: moderation_decisionsWhereInput[]
    NOT?: moderation_decisionsWhereInput | moderation_decisionsWhereInput[]
    reportId?: StringFilter<"moderation_decisions"> | string
    adminId?: StringFilter<"moderation_decisions"> | string
    decision?: StringFilter<"moderation_decisions"> | string
    reason?: StringFilter<"moderation_decisions"> | string
    createdAt?: DateTimeFilter<"moderation_decisions"> | Date | string
  }, "id">

  export type moderation_decisionsOrderByWithAggregationInput = {
    id?: SortOrder
    reportId?: SortOrder
    adminId?: SortOrder
    decision?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
    _count?: moderation_decisionsCountOrderByAggregateInput
    _max?: moderation_decisionsMaxOrderByAggregateInput
    _min?: moderation_decisionsMinOrderByAggregateInput
  }

  export type moderation_decisionsScalarWhereWithAggregatesInput = {
    AND?: moderation_decisionsScalarWhereWithAggregatesInput | moderation_decisionsScalarWhereWithAggregatesInput[]
    OR?: moderation_decisionsScalarWhereWithAggregatesInput[]
    NOT?: moderation_decisionsScalarWhereWithAggregatesInput | moderation_decisionsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"moderation_decisions"> | string
    reportId?: StringWithAggregatesFilter<"moderation_decisions"> | string
    adminId?: StringWithAggregatesFilter<"moderation_decisions"> | string
    decision?: StringWithAggregatesFilter<"moderation_decisions"> | string
    reason?: StringWithAggregatesFilter<"moderation_decisions"> | string
    createdAt?: DateTimeWithAggregatesFilter<"moderation_decisions"> | Date | string
  }

  export type system_alertsWhereInput = {
    AND?: system_alertsWhereInput | system_alertsWhereInput[]
    OR?: system_alertsWhereInput[]
    NOT?: system_alertsWhereInput | system_alertsWhereInput[]
    id?: StringFilter<"system_alerts"> | string
    eventType?: StringFilter<"system_alerts"> | string
    severity?: StringFilter<"system_alerts"> | string
    payload?: JsonFilter<"system_alerts">
    resolved?: BoolFilter<"system_alerts"> | boolean
    createdAt?: DateTimeFilter<"system_alerts"> | Date | string
  }

  export type system_alertsOrderByWithRelationInput = {
    id?: SortOrder
    eventType?: SortOrder
    severity?: SortOrder
    payload?: SortOrder
    resolved?: SortOrder
    createdAt?: SortOrder
  }

  export type system_alertsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: system_alertsWhereInput | system_alertsWhereInput[]
    OR?: system_alertsWhereInput[]
    NOT?: system_alertsWhereInput | system_alertsWhereInput[]
    eventType?: StringFilter<"system_alerts"> | string
    severity?: StringFilter<"system_alerts"> | string
    payload?: JsonFilter<"system_alerts">
    resolved?: BoolFilter<"system_alerts"> | boolean
    createdAt?: DateTimeFilter<"system_alerts"> | Date | string
  }, "id">

  export type system_alertsOrderByWithAggregationInput = {
    id?: SortOrder
    eventType?: SortOrder
    severity?: SortOrder
    payload?: SortOrder
    resolved?: SortOrder
    createdAt?: SortOrder
    _count?: system_alertsCountOrderByAggregateInput
    _max?: system_alertsMaxOrderByAggregateInput
    _min?: system_alertsMinOrderByAggregateInput
  }

  export type system_alertsScalarWhereWithAggregatesInput = {
    AND?: system_alertsScalarWhereWithAggregatesInput | system_alertsScalarWhereWithAggregatesInput[]
    OR?: system_alertsScalarWhereWithAggregatesInput[]
    NOT?: system_alertsScalarWhereWithAggregatesInput | system_alertsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"system_alerts"> | string
    eventType?: StringWithAggregatesFilter<"system_alerts"> | string
    severity?: StringWithAggregatesFilter<"system_alerts"> | string
    payload?: JsonWithAggregatesFilter<"system_alerts">
    resolved?: BoolWithAggregatesFilter<"system_alerts"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"system_alerts"> | Date | string
  }

  export type audit_logsCreateInput = {
    id?: string
    adminId: string
    actionType: string
    targetId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type audit_logsUncheckedCreateInput = {
    id?: string
    adminId: string
    actionType: string
    targetId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type audit_logsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    targetId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type audit_logsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    targetId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type audit_logsCreateManyInput = {
    id?: string
    adminId: string
    actionType: string
    targetId?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type audit_logsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    targetId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type audit_logsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    actionType?: StringFieldUpdateOperationsInput | string
    targetId?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type moderation_decisionsCreateInput = {
    id?: string
    reportId: string
    adminId: string
    decision: string
    reason: string
    createdAt?: Date | string
  }

  export type moderation_decisionsUncheckedCreateInput = {
    id?: string
    reportId: string
    adminId: string
    decision: string
    reason: string
    createdAt?: Date | string
  }

  export type moderation_decisionsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    reportId?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type moderation_decisionsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    reportId?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type moderation_decisionsCreateManyInput = {
    id?: string
    reportId: string
    adminId: string
    decision: string
    reason: string
    createdAt?: Date | string
  }

  export type moderation_decisionsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    reportId?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type moderation_decisionsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    reportId?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    decision?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type system_alertsCreateInput = {
    id?: string
    eventType: string
    severity: string
    payload: JsonNullValueInput | InputJsonValue
    resolved?: boolean
    createdAt?: Date | string
  }

  export type system_alertsUncheckedCreateInput = {
    id?: string
    eventType: string
    severity: string
    payload: JsonNullValueInput | InputJsonValue
    resolved?: boolean
    createdAt?: Date | string
  }

  export type system_alertsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    resolved?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type system_alertsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    resolved?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type system_alertsCreateManyInput = {
    id?: string
    eventType: string
    severity: string
    payload: JsonNullValueInput | InputJsonValue
    resolved?: boolean
    createdAt?: Date | string
  }

  export type system_alertsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    resolved?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type system_alertsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    severity?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    resolved?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
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

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
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

  export type audit_logsCountOrderByAggregateInput = {
    id?: SortOrder
    adminId?: SortOrder
    actionType?: SortOrder
    targetId?: SortOrder
    metadata?: SortOrder
    createdAt?: SortOrder
  }

  export type audit_logsMaxOrderByAggregateInput = {
    id?: SortOrder
    adminId?: SortOrder
    actionType?: SortOrder
    targetId?: SortOrder
    createdAt?: SortOrder
  }

  export type audit_logsMinOrderByAggregateInput = {
    id?: SortOrder
    adminId?: SortOrder
    actionType?: SortOrder
    targetId?: SortOrder
    createdAt?: SortOrder
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

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
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

  export type moderation_decisionsCountOrderByAggregateInput = {
    id?: SortOrder
    reportId?: SortOrder
    adminId?: SortOrder
    decision?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type moderation_decisionsMaxOrderByAggregateInput = {
    id?: SortOrder
    reportId?: SortOrder
    adminId?: SortOrder
    decision?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }

  export type moderation_decisionsMinOrderByAggregateInput = {
    id?: SortOrder
    reportId?: SortOrder
    adminId?: SortOrder
    decision?: SortOrder
    reason?: SortOrder
    createdAt?: SortOrder
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type system_alertsCountOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    severity?: SortOrder
    payload?: SortOrder
    resolved?: SortOrder
    createdAt?: SortOrder
  }

  export type system_alertsMaxOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    severity?: SortOrder
    resolved?: SortOrder
    createdAt?: SortOrder
  }

  export type system_alertsMinOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    severity?: SortOrder
    resolved?: SortOrder
    createdAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
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

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
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

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
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
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
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

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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