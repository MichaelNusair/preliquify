/** @jsxImportSource preact */
import { $, Conditional, For, Hydrate } from "@preliquify/preact";

const isVip = $.contains($.var("customer.tags"), $.lit("vip"));

export default function Hero() {
  return (
    <section>
      <Conditional when={isVip}>
        <p>{'{{ "Welcome back, VIP!" }}'}</p>
      </Conditional>

      <For each={$.var("collections.frontpage.products")} as="p">
        <div>
          <strong>{"{{ p.title }}"}</strong>
        </div>
      </For>

      <Hydrate
        id="cart"
        component="CartDrawer"
        props={{ currency: "{{ shop.currency }}" }}
      />
    </section>
  );
}
