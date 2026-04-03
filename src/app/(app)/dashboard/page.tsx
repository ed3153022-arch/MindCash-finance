// 1. Melhore as máscaras para garantir que não restem caracteres indesejados
const maskMoney = (v: string) => {
  v = v.replace(/\D/g, "");
  if (!v) return "";
  // Mantém apenas números e formata para exibição visual
  const val = (Number(v) / 100).toFixed(2);
  return val.replace(".", ",");
};

const maskDate = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 8) v = v.slice(0, 8);
  // Formata visualmente com barras
  if (v.length >= 5) return v.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
  if (v.length >= 3) return v.replace(/(\d{2})(\d{2})/, "$1/$2");
  return v;
};

// 2. Função de salvar com Diagnóstico de Erro
async function handleAddFixed() {
  try {
    // Validação básica antes de tentar salvar
    if (!fixoNome.trim() || !fixoValor || fixoData.length < 10) {
      notify("Preencha todos os campos corretamente!", "error");
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      notify("Sessão expirada. Refaça o login.", "error");
      return;
    }

    // CONVERSÃO SEGURA:
    // Remove a vírgula da máscara para transformar em número real (Ex: "50,00" -> 50.00)
    const numericAmount = parseFloat(fixoValor.replace(",", "."));
    // Remove as barras da data para salvar como string de números (Ex: "03/04/2026" -> "03042026")
    const cleanDate = fixoData.replace(/\//g, "");

    const { error: dbError } = await supabase.from("fixed_expenses").insert({
      user_id: user.id,
      name: fixoNome.trim(),
      amount: numericAmount,
      due_date: cleanDate
    });

    if (dbError) {
      // Isso vai mostrar no console o erro real do Supabase (ex: erro de RLS ou coluna inexistente)
      console.error("Erro detalhado do banco:", dbError);
      notify(`Erro no banco: ${dbError.message}`, "error");
      return;
    }

    notify("Sentença fixa salva com sucesso!", "success");
    setShowFixedModal(false);
    setFixoNome(""); 
    setFixoValor(""); 
    setFixoData("");
    loadData();

  } catch (err) {
    console.error("Erro inesperado:", err);
    notify("Erro inesperado ao processar dados", "error");
  }
}
