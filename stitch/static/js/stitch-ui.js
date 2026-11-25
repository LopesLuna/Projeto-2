/* ==========================================================================
   Stitch: avisos, erros nos campos e confirmação (carregado em todas as páginas)

   Stitch.aviso(texto, tipo)      pop-up pequeno no topo. tipo: 'erro' | 'sucesso' | 'info'.
                                  Some sozinho (erro 8 s, sucesso 4 s, info 5 s), para
                                  enquanto o mouse está em cima e tem o X para fechar.
   Stitch.erroCampo(campo, msg)   linha vermelha no campo + frase curta embaixo.
   Stitch.limparErro(campo)       tira o erro do campo.
   Stitch.confirmar({...})        pop-up do site para confirmar (Promise<boolean>).

   Formulários: o navegador não mostra mais o balão dele; quem avisa é este arquivo.
   Ao enviar com erro, os campos ficam vermelhos com a frase embaixo e (fora do
   popup de login) aparece um aviso resumido. O servidor sempre confere de novo.
   <form data-confirmar="texto"> pede confirmação antes de enviar.
   ========================================================================== */
(function () {
  'use strict';

  const TEMPO = { erro: 8000, sucesso: 4000, info: 5000 };

  /* ---------------------------------------------------------------- avisos */
  function pilha() {
    let p = document.getElementById('st-avisos');
    if (!p) {
      p = document.createElement('div');
      p.id = 'st-avisos';
      p.className = 'st-avisos';
      document.body.append(p);
    }
    return p;
  }

  function fecharAviso(el) {
    if (el.classList.contains('saindo')) return;
    el.classList.add('saindo');
    setTimeout(() => el.remove(), 250);
  }

  // o tempo é a animação da barrinha de baixo: parar a animação (hover/foco) para o tempo
  function prepararAviso(el) {
    const tipo = ['erro', 'sucesso', 'info'].find(t => el.classList.contains('st-aviso--' + t)) || 'info';
    el.style.setProperty('--tempo', TEMPO[tipo] + 'ms');
    const barra = el.querySelector('.st-aviso-tempo');
    if (barra) barra.addEventListener('animationend', () => fecharAviso(el));
    else setTimeout(() => fecharAviso(el), TEMPO[tipo]);
    const x = el.querySelector('.st-aviso-fechar');
    if (x) x.addEventListener('click', () => fecharAviso(el));
  }

  function aviso(texto, tipo) {
    tipo = TEMPO[tipo] ? tipo : 'erro';
    const el = document.createElement('div');
    el.className = 'st-aviso st-aviso--' + tipo;
    el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    const p = document.createElement('p');
    p.textContent = texto;
    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'st-aviso-fechar';
    x.setAttribute('aria-label', 'Fechar aviso');
    x.textContent = '×';
    const barra = document.createElement('span');
    barra.className = 'st-aviso-tempo';
    barra.setAttribute('aria-hidden', 'true');
    el.append(p, x, barra);
    // não empilha o mesmo aviso duas vezes
    const caixa = pilha();
    caixa.querySelectorAll('.st-aviso').forEach(a => {
      if (a.querySelector('p').textContent === texto) a.remove();
    });
    caixa.append(el);
    prepararAviso(el);
    return el;
  }

  /* ------------------------------------------------------- erros nos campos */
  function mensagemDe(campo) {
    const v = campo.validity;
    if (v.valueMissing) {
      return campo.dataset.msgObrigatorio || (campo.tagName === 'SELECT' ? 'Escolha uma opção.' : 'Preencha este campo.');
    }
    if (v.typeMismatch && campo.type === 'email') return 'Digite um e-mail válido, como nome@empresa.com.';
    if (v.tooShort) return `Use pelo menos ${campo.minLength} caracteres.`;
    if (v.tooLong) return `Use no máximo ${campo.maxLength} caracteres.`;
    if (v.patternMismatch) return campo.dataset.msgFormato || 'Confira o formato deste campo.';
    if (v.rangeUnderflow || v.rangeOverflow) return campo.dataset.msgFormato || 'Confira o valor deste campo.';
    if (v.customError) return campo.validationMessage;
    return campo.validationMessage || 'Confira este campo.';
  }

  function idErro(campo) {
    if (!campo.id) campo.id = 'campo-' + Math.random().toString(36).slice(2, 8);
    return campo.id + '-erro';
  }

  function descritores(campo) {
    return (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  }

  function erroCampo(campo, msg) {
    const id = idErro(campo);
    let p = document.getElementById(id);
    if (!p) {
      p = document.createElement('p');
      p.className = 'st-campo-msg';
      p.id = id;
      // data-erro-aqui: a frase vai depois desse bloco (ex.: campo + unidade na mesma linha)
      (campo.closest('[data-erro-aqui]') || campo).insertAdjacentElement('afterend', p);
    }
    p.textContent = msg;
    campo.classList.add('st-campo-erro');
    campo.setAttribute('aria-invalid', 'true');
    const ds = descritores(campo);
    if (!ds.includes(id)) campo.setAttribute('aria-describedby', [id, ...ds].join(' '));
  }

  function tirarMarca(campo) {
    const id = idErro(campo);
    const p = document.getElementById(id);
    if (p) p.remove();
    campo.classList.remove('st-campo-erro');
    campo.removeAttribute('aria-invalid');
    const ds = descritores(campo).filter(d => d !== id);
    if (ds.length) campo.setAttribute('aria-describedby', ds.join(' '));
    else campo.removeAttribute('aria-describedby');
  }

  function limparErro(campo) {
    if (!campo) return;
    const temFrase = !!document.getElementById(idErro(campo));
    tirarMarca(campo);
    // erro geral do popup ("E-mail ou senha incorretos"): marca vários campos sem frase
    // própria; corrigir um deles limpa todos e a caixa do topo
    const form = campo.form;
    if (!form || temFrase) return;
    const geral = form.querySelector('.st-modal-erro');
    if (!geral) return;
    form.querySelectorAll('.st-campo-erro').forEach(o => {
      if (!document.getElementById(idErro(o))) tirarMarca(o);
    });
    geral.remove();
  }

  function camposDe(form) {
    return Array.from(form.elements).filter(c =>
      c.willValidate && c.type !== 'hidden' && c.offsetParent !== null);
  }

  function prepararForm(form) {
    if (form.dataset.semValidacao !== undefined) return;
    form.noValidate = true;   // sem o balão do navegador: o aviso é o nosso
  }

  // confere ao enviar (fase de captura: antes de qualquer outro "submit" da página)
  document.addEventListener('submit', e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || form.dataset.semValidacao !== undefined) return;
    const invalidos = camposDe(form).filter(c => !c.checkValidity());
    if (!invalidos.length) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    invalidos.forEach(c => erroCampo(c, mensagemDe(c)));
    invalidos[0].focus();
    // dentro do popup de login a mensagem embaixo do campo já basta
    if (!form.closest('.st-modal')) {
      aviso(invalidos.length === 1
        ? 'Confira o campo destacado em vermelho.'
        : `Confira os ${invalidos.length} campos destacados em vermelho.`, 'erro');
    }
  }, true);

  // ao corrigir, o vermelho sai na hora (só nos campos que já estavam marcados)
  function aoMudar(e) {
    const c = e.target;
    if (!c.classList || !c.classList.contains('st-campo-erro')) return;
    if (c.dataset.validacaoPropria !== undefined) return;   // a página cuida desse campo
    if (c.willValidate && !c.checkValidity()) erroCampo(c, mensagemDe(c));
    else limparErro(c);
  }
  document.addEventListener('input', aoMudar);
  document.addEventListener('change', aoMudar);

  /* ------------------------------------------------------------ confirmação */
  let modal = null;

  function montarModal() {
    modal = document.createElement('div');
    modal.className = 'st-modal st-confirmar';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'st-confirmar-titulo');
    modal.setAttribute('aria-describedby', 'st-confirmar-texto');
    modal.innerHTML =
      '<div class="st-modal-fundo" data-resposta="nao"></div>' +
      '<div class="st-modal-painel st-confirmar-painel">' +
      '  <h2 id="st-confirmar-titulo"></h2>' +
      '  <p id="st-confirmar-texto"></p>' +
      '  <div class="st-confirmar-acoes">' +
      '    <button type="button" class="st-btn st-btn--sec" data-resposta="nao">Cancelar</button>' +
      '    <button type="button" class="st-btn" data-resposta="sim"></button>' +
      '  </div>' +
      '</div>';
    document.body.append(modal);
    return modal;
  }

  function confirmar(opcoes) {
    const o = Object.assign({ titulo: 'Tem certeza?', texto: '', botao: 'Confirmar', perigo: false }, opcoes);
    const m = modal || montarModal();
    const sim = m.querySelector('[data-resposta="sim"]');
    const nao = m.querySelector('.st-confirmar-acoes [data-resposta="nao"]');
    m.querySelector('#st-confirmar-titulo').textContent = o.titulo;
    m.querySelector('#st-confirmar-texto').textContent = o.texto;
    sim.textContent = o.botao;
    sim.classList.toggle('st-btn--perigo', !!o.perigo);
    const antes = document.activeElement;

    return new Promise(resolve => {
      function fim(resposta) {
        m.classList.remove('aberto');
        document.body.style.overflow = '';
        m.removeEventListener('click', clique);
        document.removeEventListener('keydown', tecla, true);
        if (antes && antes.focus) antes.focus();
        resolve(resposta);
      }
      function clique(e) {
        const r = e.target.closest('[data-resposta]');
        if (r) fim(r.dataset.resposta === 'sim');
      }
      function tecla(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fim(false); }
        if (e.key === 'Tab') {   // o foco fica dentro do pop-up
          e.preventDefault();
          (document.activeElement === nao ? sim : nao).focus();
        }
      }
      m.addEventListener('click', clique);
      document.addEventListener('keydown', tecla, true);
      m.classList.add('aberto');
      document.body.style.overflow = 'hidden';
      nao.focus();   // o padrão é o lado seguro
    });
  }

  // <form data-confirmar="..."> (opcional: data-confirmar-titulo, data-confirmar-botao,
  // data-confirmar-perigo, data-confirmar-envia="nome" manda nome=on junto)
  document.addEventListener('submit', e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || form.dataset.confirmar === undefined) return;
    if (form.dataset.confirmado === '1') return;
    e.preventDefault();
    confirmar({
      titulo: form.dataset.confirmarTitulo || 'Tem certeza?',
      texto: form.dataset.confirmar,
      botao: form.dataset.confirmarBotao || 'Confirmar',
      perigo: form.dataset.confirmarPerigo !== undefined,
    }).then(ok => {
      if (!ok) return;
      form.dataset.confirmado = '1';
      if (form.dataset.confirmarEnvia) {
        const extra = document.createElement('input');
        extra.type = 'hidden';
        extra.name = form.dataset.confirmarEnvia;
        extra.value = 'on';
        form.append(extra);
      }
      form.submit();
    });
  });

  /* ------------------------------------------------------------------ início */
  document.querySelectorAll('form').forEach(prepararForm);
  document.querySelectorAll('.st-avisos .st-aviso').forEach(prepararAviso);

  window.Stitch = Object.assign(window.Stitch || {}, { aviso, erroCampo, limparErro, confirmar });
})();
