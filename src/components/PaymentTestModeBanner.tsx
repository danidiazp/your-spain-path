const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;
  return (
    <div className="w-full bg-secondary border-b border-border px-4 py-2 text-center text-xs text-muted-foreground">
      Modo prueba: ningún cobro es real. Usa la tarjeta <span className="font-mono text-foreground">4242 4242 4242 4242</span> para simular un pago.
    </div>
  );
}
