"use client";

import { useState } from "react";
import { useEventTracking } from "@/lib/hooks/use-event-tracking";

/**
 * Exemplo de formulário com rastreamento de conversão integrado
 * Este componente demonstra como implementar o rastreamento para Meta Pixel e GA4
 * em um formulário de captura de leads
 */
export function TrackedLeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Usar o hook de rastreamento unificado
  const { trackLead } = useEventTracking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulação de envio do formulário para o backend
      const response = await fetch("/api/submit-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const leadId = data.leadId || `lead_${Date.now()}`;
        
        // Rastrear conversão para ambos Meta Pixel e GA4
        trackLead({
          content_category: "formulário",
          content_name: "formulário-demo",
          form_id: "form-demo-conversao",
          lead_id: leadId,
          lead_type: "contato",
          value: 50, // Valor estimado do lead (se aplicável)
          currency: "BRL"
        });
        
        // Feedback ao usuário
        setSubmitted(true);
        
        // Limpar formulário
        setName("");
        setEmail("");
        setPhone("");
      } else {
        throw new Error("Falha ao enviar formulário");
      }
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      alert("Desculpe, ocorreu um erro ao enviar o formulário. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Obrigado pelo contato!</h2>
        <p className="mb-4">Recebemos seus dados e entraremos em contato em breve.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enviar outro contato
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Entre em contato</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
        
        <p className="text-xs text-gray-500 mt-2">
          Seus dados estão seguros e não serão compartilhados com terceiros.
        </p>
      </form>
    </div>
  );
} 