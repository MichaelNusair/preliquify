/** @jsxImportSource preact */
import { h } from "preact";
import { $, Conditional } from "@preliquify/preact";

// This component demonstrates the difference between:
// 1. Build-time JavaScript `if` statements
// 2. Runtime Liquid conditionals using `<Conditional>`

export default function IfExample() {
  // ✅ BUILD-TIME IF: This executes at build time
  // Only one branch will appear in the final Liquid output
  if (process.env.NODE_ENV === "production") {
    return <div>Production build</div>;
  }

  // ❌ WRONG: This won't work - $.var() returns an Expr object, not a boolean
  // You can't use Expr objects in regular JavaScript if statements
  // if ($.var("customer.email")) {
  //   return <div>Has email</div>;
  // }

  // ✅ RUNTIME IF: This creates a Liquid {% if %} tag
  const hasEmail = $.var("customer.email");

  return (
    <section>
      <Conditional when={hasEmail}>
        <p>Customer has an email</p>
      </Conditional>

      {/* ✅ NESTED: You can combine build-time and runtime conditionals */}
      {process.env.NODE_ENV === "development" && <div>Debug mode</div>}

      <Conditional when={$.var("product.available")}>
        <div>Product is available</div>
      </Conditional>
    </section>
  );
}
