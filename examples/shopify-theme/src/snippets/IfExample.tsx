/** @jsxImportSource preact */
import { h } from "preact";
import { $, Conditional } from "@preliquify/preact";

export default function IfExample() {
  if (process.env.NODE_ENV === "production") {
    return <div>Production build</div>;
  }

  const hasEmail = $.var("customer.email");

  return (
    <section>
      <Conditional when={hasEmail}>
        <p>Customer has an email</p>
      </Conditional>

      {process.env.NODE_ENV === "development" && <div>Debug mode</div>}

      <Conditional when={$.var("product.available")}>
        <div>Product is available</div>
      </Conditional>
    </section>
  );
}
