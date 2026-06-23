import { describe, expect, it } from "@effect/vitest"
import { decode, encode, parse } from "../src/index.js"

describe("@avro-effect/core", () => {
  it("encodes and decodes primitives", () => {
    expect(decode("null", encode("null", null))).toEqual(null)
    expect(decode("boolean", encode("boolean", true))).toEqual(true)
    expect(decode("int", encode("int", -12))).toEqual(-12)
    expect(decode("long", encode("long", 123456))).toEqual(123456)
    expect(decode("float", encode("float", 1.5))).toEqual(1.5)
    expect(decode("double", encode("double", Math.PI))).toEqual(Math.PI)
    expect(decode("string", encode("string", "hello"))).toEqual("hello")
    expect([...decode<Buffer>("bytes", encode("bytes", Buffer.from([1, 2, 3])))]).toEqual([1, 2, 3])
  })

  it("encodes and decodes records, arrays, maps, enums, fixed and unions", () => {
    const schema = {
      type: "record",
      name: "Envelope",
      fields: [
        { name: "id", type: "long" },
        { name: "kind", type: { type: "enum", name: "Kind", symbols: ["Created", "Deleted"] } },
        { name: "hash", type: { type: "fixed", name: "Hash", size: 3 } },
        { name: "tags", type: { type: "array", items: "string" } },
        { name: "metadata", type: { type: "map", values: "string" } },
        { name: "optional", type: ["null", "string"], default: null }
      ]
    } as const
    const type = parse(schema)
    const value = {
      id: 1,
      kind: "Created",
      hash: Buffer.from([1, 2, 3]),
      tags: ["a", "b"],
      metadata: { x: "y" },
      optional: "ok"
    }

    expect(type.fromBuffer(type.toBuffer(value))).toEqual(value)
  })

  it("supports recursive named references", () => {
    const schema = {
      type: "record",
      name: "Tree",
      fields: [
        { name: "value", type: "string" },
        { name: "children", type: { type: "array", items: "Tree" } }
      ]
    } as const
    const value = { value: "root", children: [{ value: "leaf", children: [] }] }

    expect(decode(schema, encode(schema, value))).toEqual(value)
  })
})

