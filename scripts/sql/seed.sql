-- Marcas
INSERT INTO "Marcas" ("Id", "Name", "Active")
SELECT gen_random_uuid(), v."Name", true
FROM (VALUES ('Sono Leve'), ('Clelia Anastácio'), ('Thainá Reichen'), ('Ronca&Fuça')) AS v("Name")
WHERE NOT EXISTS (SELECT 1 FROM "Marcas" WHERE "Name" = v."Name");

-- Categorias
INSERT INTO "Categorias" ("Id", "Name", "Grade", "Active")
SELECT gen_random_uuid(), v."Name", v."Grade", true
FROM (VALUES
  ('Adulto Feminino',  '["PP","P","M","G","GG","50","52","54","56"]'),
  ('Adulto Masculino', '["40","42","44","46","48","50","52","54","56"]'),
  ('Infantil',         '["RN","1","2","3","4","6","8","10","12","14","16"]'),
  ('Pantufa',          '["35","36","37","38","39","40","41","42","43","44"]')
) AS v("Name", "Grade")
WHERE NOT EXISTS (SELECT 1 FROM "Categorias" WHERE "Name" = v."Name");

-- Tipos
INSERT INTO "Tipos" ("Id", "Name", "Active")
SELECT gen_random_uuid(), v."Name", true
FROM (VALUES ('Camisola'), ('Conjunto'), ('Macacão'), ('Pantufa'), ('Pescador')) AS v("Name")
WHERE NOT EXISTS (SELECT 1 FROM "Tipos" WHERE "Name" = v."Name");

-- Subtipos
INSERT INTO "Subtipos" ("Id", "Name", "Active")
SELECT gen_random_uuid(), v."Name", true
FROM (VALUES ('Alça'), ('Regata'), ('Manga Curta'), ('Manga Longa')) AS v("Name")
WHERE NOT EXISTS (SELECT 1 FROM "Subtipos" WHERE "Name" = v."Name");

-- Coleções
INSERT INTO "Colecoes" ("Id", "Name", "DataInicio", "DataFim", "Active")
SELECT gen_random_uuid(), v."Name", v."DataInicio"::date, v."DataFim"::date, true
FROM (VALUES
  ('Inverno 2025', '2025-06-01', '2025-08-31'),
  ('Outono 2025',  '2025-03-01', '2025-05-31'),
  ('Verão 2025',   '2024-12-01', '2025-02-28'),
  ('Básico',       NULL::text,   NULL::text)
) AS v("Name", "DataInicio", "DataFim")
WHERE NOT EXISTS (SELECT 1 FROM "Colecoes" WHERE "Name" = v."Name");

-- Formas de pagamento base (sem maquininha/link/tap — esses têm taxas configuradas abaixo)
INSERT INTO "FormasPagamento" ("Id", "Nome", "Tipo", "PermiteParcelamento", "ExigeBandeira", "RepassaTaxaAoCliente", "Ativo", "CriadoEm", "AtualizadoEm")
SELECT gen_random_uuid(), v."Nome", v."Tipo", v."Parcel"::bool, v."Exige"::bool, false, v."Ativo"::bool, NOW(), NOW()
FROM (VALUES
  ('Pix',             'Pix',      'false', 'false', 'true'),
  ('Dinheiro',        'Dinheiro', 'false', 'false', 'true'),
  ('Boleto',          'Boleto',   'false', 'false', 'true'),
  ('Cartão Débito',   'Debito',   'false', 'true',  'true'),
  ('Cartão Crédito',  'Credito',  'true',  'true',  'true'),
  ('Link Débito',     'Debito',   'false', 'true',  'true'),
  ('Link Crédito',    'Credito',  'true',  'true',  'true'),
  ('TAP2PAY Débito',  'Debito',   'false', 'true',  'true'),
  ('TAP2PAY Crédito', 'Credito',  'true',  'true',  'true')
) AS v("Nome", "Tipo", "Parcel", "Exige", "Ativo")
WHERE NOT EXISTS (SELECT 1 FROM "FormasPagamento" WHERE "Nome" = v."Nome");

-- Bandeiras de cartão
INSERT INTO "BandeirasCartao" ("Id", "Nome", "Ativo", "CriadoEm", "AtualizadoEm")
SELECT gen_random_uuid(), v."Nome", true, NOW(), NOW()
FROM (VALUES ('Visa'), ('Mastercard'), ('Elo'), ('Hipercard'), ('American Express')) AS v("Nome")
WHERE NOT EXISTS (SELECT 1 FROM "BandeirasCartao" WHERE "Nome" = v."Nome");

-- Cliente padrão para varejo sem identificação
INSERT INTO "Clientes" ("Id", "Nome", "Telefone", "Cpf", "Tipo", "Status", "Credito", "CriadoEm", "AtualizadoEm")
SELECT gen_random_uuid(), 'CONSUMIDOR FINAL', '', '', 0, 'Ativo', 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Clientes" WHERE "Nome" = 'CONSUMIDOR FINAL');

-- ─── Configurações de Taxa por Bandeira ───────────────────────────────────────
-- Tabela: ConfiguracoesTaxaCartao (FormaPagamentoId, BandeiraId, TipoCartao)
-- Tabela: ConfiguracoesTaxaCartaoParcelas (ConfiguracaoTaxaCartaoId, NumeroParcelas, PercentualTaxa, PrazoRecebimentoDias)

INSERT INTO "ConfiguracoesTaxaCartao" ("Id", "FormaPagamentoId", "BandeiraId", "TipoCartao", "Ativo", "CriadoEm", "AtualizadoEm")
SELECT gen_random_uuid(),
       (SELECT "Id" FROM "FormasPagamento" WHERE "Nome" = v."FormaNome" LIMIT 1),
       (SELECT "Id" FROM "BandeirasCartao"  WHERE "Nome" = v."BandeiraNome" LIMIT 1),
       v."TipoCartao",
       true,
       NOW(),
       NOW()
FROM (VALUES
  -- Maquininha débito
  ('Cartão Débito', 'Mastercard',       'Débito'),
  ('Cartão Débito', 'Visa',             'Débito'),
  ('Cartão Débito', 'Elo',              'Débito'),
  ('Cartão Débito', 'American Express', 'Débito'),
  -- Maquininha crédito
  ('Cartão Crédito', 'Mastercard',       'Crédito'),
  ('Cartão Crédito', 'Visa',             'Crédito'),
  ('Cartão Crédito', 'Elo',              'Crédito'),
  ('Cartão Crédito', 'American Express', 'Crédito'),
  -- Link débito
  ('Link Débito', 'Mastercard',       'Débito'),
  ('Link Débito', 'Visa',             'Débito'),
  ('Link Débito', 'Elo',              'Débito'),
  ('Link Débito', 'American Express', 'Débito'),
  -- Link crédito
  ('Link Crédito', 'Mastercard',       'Crédito'),
  ('Link Crédito', 'Visa',             'Crédito'),
  ('Link Crédito', 'Elo',              'Crédito'),
  ('Link Crédito', 'American Express', 'Crédito'),
  -- TAP2PAY débito
  ('TAP2PAY Débito', 'Mastercard',       'Débito'),
  ('TAP2PAY Débito', 'Visa',             'Débito'),
  ('TAP2PAY Débito', 'Elo',              'Débito'),
  ('TAP2PAY Débito', 'American Express', 'Débito'),
  -- TAP2PAY crédito
  ('TAP2PAY Crédito', 'Mastercard',       'Crédito'),
  ('TAP2PAY Crédito', 'Visa',             'Crédito'),
  ('TAP2PAY Crédito', 'Elo',              'Crédito'),
  ('TAP2PAY Crédito', 'American Express', 'Crédito')
) AS v("FormaNome", "BandeiraNome", "TipoCartao")
WHERE NOT EXISTS (
  SELECT 1
  FROM "ConfiguracoesTaxaCartao" c
  JOIN "FormasPagamento" fp ON c."FormaPagamentoId" = fp."Id"
  JOIN "BandeirasCartao"  b  ON c."BandeiraId"      = b."Id"
  WHERE fp."Nome" = v."FormaNome"
    AND b."Nome"  = v."BandeiraNome"
    AND c."TipoCartao" = v."TipoCartao"
);

-- ─── Parcelas por configuração ────────────────────────────────────────────────
-- Débito = sempre 1 parcela. Crédito = 1x a 4x.
-- PrazoRecebimentoDias: débito=1, crédito Nx=N*30.

INSERT INTO "ConfiguracoesTaxaCartaoParcelas" (
  "Id", "ConfiguracaoTaxaCartaoId", "NumeroParcelas", "PercentualTaxa", "PrazoRecebimentoDias", "TaxaFixa", "CriadoEm", "AtualizadoEm"
)
SELECT
  gen_random_uuid(),
  (
    SELECT c."Id"
    FROM "ConfiguracoesTaxaCartao" c
    JOIN "FormasPagamento" fp ON c."FormaPagamentoId" = fp."Id"
    JOIN "BandeirasCartao"  b  ON c."BandeiraId"      = b."Id"
    WHERE fp."Nome" = v."FormaNome"
      AND b."Nome"  = v."BandeiraNome"
      AND c."TipoCartao" = v."TipoCartao"
    LIMIT 1
  ),
  v."NumeroParcelas"::int,
  v."PercentualTaxa"::numeric,
  v."PrazoRecebimentoDias"::int,
  NULL,
  NOW(),
  NOW()
FROM (VALUES
  -- Maquininha débito (1 parcela)
  ('Cartão Débito', 'Mastercard',       'Débito',  '1', '1.69', '1'),
  ('Cartão Débito', 'Visa',             'Débito',  '1', '1.69', '1'),
  ('Cartão Débito', 'Elo',              'Débito',  '1', '2.88', '1'),
  ('Cartão Débito', 'American Express', 'Débito',  '1', '2.88', '1'),
  -- Maquininha crédito (1x a 4x) — Mastercard e Visa iguais
  ('Cartão Crédito', 'Mastercard',       'Crédito', '1', '3.86',  '1'),
  ('Cartão Crédito', 'Mastercard',       'Crédito', '2', '9.86',  '1'),
  ('Cartão Crédito', 'Mastercard',       'Crédito', '3', '11.24', '1'),
  ('Cartão Crédito', 'Mastercard',       'Crédito', '4', '12.59', '1'),
  ('Cartão Crédito', 'Visa',             'Crédito', '1', '3.86',  '1'),
  ('Cartão Crédito', 'Visa',             'Crédito', '2', '9.86',  '1'),
  ('Cartão Crédito', 'Visa',             'Crédito', '3', '11.24', '1'),
  ('Cartão Crédito', 'Visa',             'Crédito', '4', '12.59', '1'),
  -- Maquininha crédito — Elo e American Express iguais
  ('Cartão Crédito', 'Elo',              'Crédito', '1', '5.05',  '1'),
  ('Cartão Crédito', 'Elo',              'Crédito', '2', '11.25', '1'),
  ('Cartão Crédito', 'Elo',              'Crédito', '3', '12.63', '1'),
  ('Cartão Crédito', 'Elo',              'Crédito', '4', '13.98', '1'),
  ('Cartão Crédito', 'American Express', 'Crédito', '1', '5.05',  '1'),
  ('Cartão Crédito', 'American Express', 'Crédito', '2', '11.25', '1'),
  ('Cartão Crédito', 'American Express', 'Crédito', '3', '12.63', '1'),
  ('Cartão Crédito', 'American Express', 'Crédito', '4', '13.98', '1'),
  -- Link débito
  ('Link Débito', 'Mastercard',       'Débito', '1', '0.74', '1'),
  ('Link Débito', 'Visa',             'Débito', '1', '0.74', '1'),
  ('Link Débito', 'Elo',              'Débito', '1', '2.57', '1'),
  ('Link Débito', 'American Express', 'Débito', '1', '2.67', '1'),
  -- Link crédito — Mastercard e Visa iguais
  ('Link Crédito', 'Mastercard',       'Crédito', '1', '0.74', '1'),
  ('Link Crédito', 'Mastercard',       'Crédito', '2', '3.99', '1'),
  ('Link Crédito', 'Mastercard',       'Crédito', '3', '4.99', '1'),
  ('Link Crédito', 'Mastercard',       'Crédito', '4', '5.99', '1'),
  ('Link Crédito', 'Visa',             'Crédito', '1', '0.74', '1'),
  ('Link Crédito', 'Visa',             'Crédito', '2', '3.99', '1'),
  ('Link Crédito', 'Visa',             'Crédito', '3', '4.99', '1'),
  ('Link Crédito', 'Visa',             'Crédito', '4', '5.99', '1'),
  -- Link crédito — Elo e American Express iguais
  ('Link Crédito', 'Elo',              'Crédito', '1', '4.33', '1'),
  ('Link Crédito', 'Elo',              'Crédito', '2', '7.01', '1'),
  ('Link Crédito', 'Elo',              'Crédito', '3', '7.57', '1'),
  ('Link Crédito', 'Elo',              'Crédito', '4', '8.37', '1'),
  ('Link Crédito', 'American Express', 'Crédito', '1', '4.33', '1'),
  ('Link Crédito', 'American Express', 'Crédito', '2', '7.01', '1'),
  ('Link Crédito', 'American Express', 'Crédito', '3', '7.57', '1'),
  ('Link Crédito', 'American Express', 'Crédito', '4', '8.37', '1'),
  -- TAP2PAY débito
  ('TAP2PAY Débito', 'Mastercard',       'Débito', '1', '1.09', '1'),
  ('TAP2PAY Débito', 'Visa',             'Débito', '1', '1.09', '1'),
  ('TAP2PAY Débito', 'Elo',              'Débito', '1', '2.28', '1'),
  ('TAP2PAY Débito', 'American Express', 'Débito', '1', '2.28', '1'),
  -- TAP2PAY crédito — Mastercard e Visa iguais
  ('TAP2PAY Crédito', 'Mastercard',       'Crédito', '1', '2.99', '1'),
  ('TAP2PAY Crédito', 'Mastercard',       'Crédito', '2', '5.99', '1'),
  ('TAP2PAY Crédito', 'Mastercard',       'Crédito', '3', '7.99', '1'),
  ('TAP2PAY Crédito', 'Mastercard',       'Crédito', '4', '8.99', '1'),
  ('TAP2PAY Crédito', 'Visa',             'Crédito', '1', '2.99', '1'),
  ('TAP2PAY Crédito', 'Visa',             'Crédito', '2', '5.99', '1'),
  ('TAP2PAY Crédito', 'Visa',             'Crédito', '3', '7.99', '1'),
  ('TAP2PAY Crédito', 'Visa',             'Crédito', '4', '8.99', '1'),
  -- TAP2PAY crédito — Elo e American Express iguais
  ('TAP2PAY Crédito', 'Elo',              'Crédito', '1', '4.18', '1'),
  ('TAP2PAY Crédito', 'Elo',              'Crédito', '2', '7.18', '1'),
  ('TAP2PAY Crédito', 'Elo',              'Crédito', '3', '9.18', '1'),
  ('TAP2PAY Crédito', 'Elo',              'Crédito', '4', '10.18', '1'),
  ('TAP2PAY Crédito', 'American Express', 'Crédito', '1', '4.18', '1'),
  ('TAP2PAY Crédito', 'American Express', 'Crédito', '2', '7.18', '1'),
  ('TAP2PAY Crédito', 'American Express', 'Crédito', '3', '9.18', '1'),
  ('TAP2PAY Crédito', 'American Express', 'Crédito', '4', '10.18', '1')
) AS v("FormaNome", "BandeiraNome", "TipoCartao", "NumeroParcelas", "PercentualTaxa", "PrazoRecebimentoDias")
WHERE NOT EXISTS (
  SELECT 1
  FROM "ConfiguracoesTaxaCartaoParcelas" p
  JOIN "ConfiguracoesTaxaCartao" c ON p."ConfiguracaoTaxaCartaoId" = c."Id"
  JOIN "FormasPagamento" fp ON c."FormaPagamentoId" = fp."Id"
  JOIN "BandeirasCartao"  b  ON c."BandeiraId"      = b."Id"
  WHERE fp."Nome" = v."FormaNome"
    AND b."Nome"  = v."BandeiraNome"
    AND c."TipoCartao" = v."TipoCartao"
    AND p."NumeroParcelas" = v."NumeroParcelas"::int
);
