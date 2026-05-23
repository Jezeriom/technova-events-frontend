(function () {
  const API_BASE = window.TECHNOVA_API_BASE ||
    "https://tcc-ingenieria-de-software-production.up.railway.app/api";

  const state = {
    usuarios: { page: 0, size: 12, totalPages: 0, query: "" },
    eventos: { page: 0, size: 12, totalPages: 0, query: "", categoriaId: "" },
    categorias: { page: 0, size: 12, totalPages: 0, query: "" },
    reservas: { page: 0, size: 24, totalPages: 0, query: "", estado: "" },
  };

  const pages = {
    usuarios: "usuarios.html",
    eventos: "eventos.html",
    categorias: "categorias.html",
    reservas: "reservas.html",
    dashboard: "dashboard.html",
    reportes: "academics analytics.html",
  };

  function endpoint(path) {
    return `${API_BASE}${path}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function money(value) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
      .format(Number(value || 0));
  }

  function dateTime(value) {
    if (!value) return "Sin fecha";
    return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }

  function shortDate(value) {
    if (!value) return "Sin fecha";
    return new Intl.DateTimeFormat("es-CO", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  }

  function initials(parts) {
    return parts.filter(Boolean).slice(0, 2).map((part) => part.trim()[0] || "").join("").toUpperCase() || "TE";
  }

  function pageData(payload) {
    const data = payload?.data ?? payload;
    if (Array.isArray(data)) {
      return { content: data, number: 0, totalPages: 1, totalElements: data.length };
    }
    return {
      content: data?.content ?? [],
      number: data?.number ?? 0,
      totalPages: data?.totalPages ?? 1,
      totalElements: data?.totalElements ?? (data?.content?.length ?? 0),
    };
  }

  async function api(path, options = {}) {
    const response = await fetch(endpoint(path), {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });

    if (response.status === 204) return null;

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errors = payload.errors?.length ? payload.errors : [payload.message || "No fue posible completar la operacion"];
      throw new Error(errors.join("\n"));
    }
    return payload;
  }

  function params(values) {
    const query = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    return query.toString();
  }

  function notify(message, type = "success") {
    let box = document.querySelector("[data-api-toast]");
    if (!box) {
      box = document.createElement("div");
      box.dataset.apiToast = "true";
      box.className = "fixed top-4 right-4 z-[100] max-w-md rounded-lg px-4 py-3 shadow-lg font-body-md text-body-sm whitespace-pre-line";
      document.body.appendChild(box);
    }
    box.className = box.className.replace(/bg-\S+|text-\S+/g, "").trim();
    box.classList.add(type === "error" ? "bg-error-container" : "bg-tertiary-fixed-dim", type === "error" ? "text-error" : "text-on-tertiary-fixed");
    box.textContent = message;
    window.clearTimeout(box._timer);
    box._timer = window.setTimeout(() => box.remove(), 4500);
  }

  function setBusy(container, label = "Cargando datos...") {
    if (!container) return;
    container.innerHTML = `<div class="col-span-full w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center text-on-surface-variant">${label}</div>`;
  }

  function emptyState(label) {
    return `<div class="col-span-full w-full rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center text-on-surface-variant">${label}</div>`;
  }

  function modal(title, fields, onSubmit, values = {}) {
    const existing = document.querySelector("[data-api-modal]");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.dataset.apiModal = "true";
    overlay.className = "fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4";
    overlay.innerHTML = `
      <form class="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/40 overflow-hidden">
        <div class="flex items-center justify-between p-5 border-b border-outline-variant/30">
          <h2 class="font-title-lg text-title-lg text-on-surface">${escapeHtml(title)}</h2>
          <button type="button" data-close class="p-2 rounded-full hover:bg-surface-container">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
          ${fields.map((field) => fieldMarkup(field, values[field.name])).join("")}
          <p data-form-error class="md:col-span-2 hidden rounded-lg bg-error-container text-error px-3 py-2 text-body-sm whitespace-pre-line"></p>
        </div>
        <div class="flex justify-end gap-3 p-5 border-t border-outline-variant/30 bg-surface-container-low">
          <button type="button" data-close class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest">Cancelar</button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-secondary text-on-secondary hover:opacity-90">Guardar</button>
        </div>
      </form>`;

    overlay.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => overlay.remove()));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.remove();
    });
    overlay.querySelector("form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const error = form.querySelector("[data-form-error]");
      const submit = form.querySelector("button[type='submit']");
      const data = Object.fromEntries(new FormData(form).entries());
      fields.forEach((field) => {
        if (field.type === "number" && data[field.name] !== "") data[field.name] = Number(data[field.name]);
        if (field.type === "datetime-local" && data[field.name]) data[field.name] = data[field.name].length === 16 ? `${data[field.name]}:00` : data[field.name];
      });
      try {
        submit.disabled = true;
        await onSubmit(data);
        overlay.remove();
      } catch (err) {
        error.textContent = err.message;
        error.classList.remove("hidden");
      } finally {
        submit.disabled = false;
      }
    });
    document.body.appendChild(overlay);
  }

  function fieldMarkup(field, value) {
    const val = value ?? field.defaultValue ?? "";
    const span = field.full ? "md:col-span-2" : "";
    const common = `name="${field.name}" ${field.required ? "required" : ""} class="w-full rounded-lg border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-secondary/30"`;
    if (field.type === "select") {
      return `<label class="${span} flex flex-col gap-1 text-label-md text-on-surface-variant">
        ${escapeHtml(field.label)}
        <select ${common}>${field.options.map((option) => `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(val) ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select>
      </label>`;
    }
    if (field.type === "textarea") {
      return `<label class="${span} flex flex-col gap-1 text-label-md text-on-surface-variant">
        ${escapeHtml(field.label)}
        <textarea ${common} rows="4">${escapeHtml(val)}</textarea>
      </label>`;
    }
    return `<label class="${span} flex flex-col gap-1 text-label-md text-on-surface-variant">
      ${escapeHtml(field.label)}
      <input type="${field.type || "text"}" ${common} value="${escapeHtml(val)}" />
    </label>`;
  }

  function pagerHtml(page, totalPages, totalElements) {
    return `
      <div class="col-span-full flex flex-wrap items-center justify-between gap-3 pt-2 text-body-sm text-on-surface-variant">
        <span>${totalElements} registros</span>
        <div class="flex items-center gap-2">
          <button data-page-prev class="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-highest disabled:opacity-40" ${page <= 0 ? "disabled" : ""}>Anterior</button>
          <span>Pagina ${page + 1} de ${Math.max(totalPages, 1)}</span>
          <button data-page-next class="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-highest disabled:opacity-40" ${page + 1 >= totalPages ? "disabled" : ""}>Siguiente</button>
        </div>
      </div>`;
  }

  function bindPager(container, key, loader) {
    container.querySelector("[data-page-prev]")?.addEventListener("click", () => {
      state[key].page = Math.max(0, state[key].page - 1);
      loader();
    });
    container.querySelector("[data-page-next]")?.addEventListener("click", () => {
      state[key].page += 1;
      loader();
    });
  }

  function normalizedText(element) {
    return element.textContent
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replaceAll("ã­", "i")
      .trim();
  }

  function pageFromLabel(text) {
    const routes = [
      { page: pages.dashboard, labels: ["dashboard", "inicio"] },
      { page: pages.usuarios, labels: ["usuario", "user", "participant"] },
      { page: pages.eventos, labels: ["evento", "event", "session"] },
      { page: pages.categorias, labels: ["categor", "category", "resource"] },
      { page: pages.reservas, labels: ["reserva", "reservation"] },
      { page: pages.reportes, labels: ["reporte", "report", "analytic", "performance"] },
    ];
    return routes.find((route) => route.labels.some((label) => text.includes(label)))?.page;
  }

  function wireNavigation() {
    document.querySelectorAll("aside a, nav a, a[href='#']").forEach((link) => {
      const target = pageFromLabel(normalizedText(link));
      if (target) link.href = target;
    });

    document.querySelectorAll("aside button").forEach((button) => {
      const target = pageFromLabel(normalizedText(button));
      if (!target) return;
      button.type = "button";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.href = target;
      });
    });
  }

  function bindSearch(key, loader) {
    const input = document.querySelector("input[type='text']");
    if (!input) return;
    input.addEventListener("input", () => {
      state[key].query = input.value.trim().toLowerCase();
      state[key].page = 0;
      window.clearTimeout(input._apiTimer);
      input._apiTimer = window.setTimeout(loader, 250);
    });
  }

  function matchesQuery(item, query) {
    if (!query) return true;
    return JSON.stringify(item).toLowerCase().includes(query);
  }

  async function all(resource, size = 100) {
    const payload = await api(`/${resource}?${params({ page: 0, size })}`);
    return pageData(payload).content;
  }

  function usuarioFields() {
    return [
      { name: "nombre", label: "Nombre", required: true },
      { name: "apellido", label: "Apellido", required: true },
      { name: "correo", label: "Correo", type: "email", required: true, full: true },
      { name: "telefono", label: "Telefono", required: true, full: true },
    ];
  }

  async function loadUsuarios() {
    const container = document.querySelector(".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4");
    if (!container) return;
    setBusy(container);
    try {
      const s = state.usuarios;
      const payload = await api(`/usuarios?${params({ page: s.page, size: s.size, sort: "fechaRegistro,desc" })}`);
      const page = pageData(payload);
      s.totalPages = page.totalPages;
      const items = page.content.filter((item) => matchesQuery(item, s.query));
      container.innerHTML = items.length ? items.map(usuarioCard).join("") + pagerHtml(page.number, page.totalPages, page.totalElements) : emptyState("No hay usuarios para mostrar.") + pagerHtml(page.number, page.totalPages, page.totalElements);
      container.querySelectorAll("[data-edit-user]").forEach((button) => button.addEventListener("click", () => editUsuario(Number(button.dataset.editUser))));
      container.querySelectorAll("[data-delete-user]").forEach((button) => button.addEventListener("click", () => deleteUsuario(Number(button.dataset.deleteUser))));
      bindPager(container, "usuarios", loadUsuarios);
    } catch (err) {
      container.innerHTML = emptyState(err.message);
    }
  }

  function usuarioCard(user) {
    return `
      <div class="user-card bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent transition-all cursor-pointer">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-secondary-container/15 text-secondary flex items-center justify-center font-bold">${escapeHtml(initials([user.nombre, user.apellido]))}</div>
            <div>
              <h3 class="font-title-md text-title-md text-on-surface">${escapeHtml(user.nombre)} ${escapeHtml(user.apellido)}</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant">ID ${escapeHtml(user.id)}</p>
            </div>
          </div>
          <div class="flex gap-1">
            <button data-edit-user="${user.id}" class="p-1 hover:bg-surface-container rounded transition-all"><span class="material-symbols-outlined text-[20px]">edit</span></button>
            <button data-delete-user="${user.id}" class="p-1 hover:bg-error-container text-error rounded transition-all"><span class="material-symbols-outlined text-[20px]">delete</span></button>
          </div>
        </div>
        <div class="space-y-2 text-body-sm text-on-surface-variant">
          <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">mail</span>${escapeHtml(user.correo)}</p>
          <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">call</span>${escapeHtml(user.telefono)}</p>
          <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">calendar_month</span>${dateTime(user.fechaRegistro)}</p>
        </div>
      </div>`;
  }

  function newUsuario() {
    modal("Nuevo usuario", usuarioFields(), async (data) => {
      await api("/usuarios", { method: "POST", body: JSON.stringify(data) });
      notify("Usuario creado exitosamente");
      loadUsuarios();
    });
  }

  async function editUsuario(id) {
    const payload = await api(`/usuarios/${id}`);
    modal("Editar usuario", usuarioFields(), async (data) => {
      await api(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(data) });
      notify("Usuario actualizado exitosamente");
      loadUsuarios();
    }, payload.data);
  }

  async function deleteUsuario(id) {
    if (!window.confirm("Eliminar este usuario?")) return;
    await api(`/usuarios/${id}`, { method: "DELETE" });
    notify("Usuario eliminado");
    loadUsuarios();
  }

  async function categoriaOptions() {
    const categorias = await all("categorias");
    return categorias.map((categoria) => ({ value: categoria.id, label: categoria.nombre }));
  }

  async function eventoFields(values = {}) {
    const options = await categoriaOptions();
    return [
      { name: "nombre", label: "Nombre", required: true, full: true },
      { name: "descripcion", label: "Descripcion", type: "textarea", full: true },
      { name: "fechaEvento", label: "Fecha", type: "datetime-local", required: true },
      { name: "lugar", label: "Lugar", required: true },
      { name: "capacidadMaxima", label: "Capacidad maxima", type: "number", required: true },
      { name: "cuposDisponibles", label: "Cupos disponibles", type: "number", required: true },
      { name: "precioEntrada", label: "Precio entrada", type: "number", required: true },
      { name: "estadoEvento", label: "Estado", type: "select", options: [{ value: "ACTIVO", label: "Activo" }, { value: "CANCELADO", label: "Cancelado" }, { value: "FINALIZADO", label: "Finalizado" }] },
      { name: "categoriaId", label: "Categoria", type: "select", required: true, options, defaultValue: values.categoria?.id },
    ];
  }

  function eventoPayload(data) {
    return { ...data, categoriaId: Number(data.categoriaId), precioEntrada: Number(data.precioEntrada) };
  }

  async function loadEventos() {
    const container = document.querySelector(".p-gutter.flex-1.grid");
    if (!container) return;
    setBusy(container);
    try {
      const s = state.eventos;
      const path = s.categoriaId ? `/eventos/categoria/${s.categoriaId}` : "/eventos";
      const payload = await api(`${path}?${params({ page: s.page, size: s.size, sort: "fechaEvento,asc" })}`);
      const page = pageData(payload);
      s.totalPages = page.totalPages;
      const items = page.content.filter((item) => matchesQuery(item, s.query));
      container.innerHTML = items.length ? items.map(eventoCard).join("") + addEventCard() + pagerHtml(page.number, page.totalPages, page.totalElements) : emptyState("No hay eventos para mostrar.") + addEventCard() + pagerHtml(page.number, page.totalPages, page.totalElements);
      container.querySelectorAll("[data-edit-event]").forEach((button) => button.addEventListener("click", () => editEvento(Number(button.dataset.editEvent))));
      container.querySelectorAll("[data-delete-event]").forEach((button) => button.addEventListener("click", () => deleteEvento(Number(button.dataset.deleteEvent))));
      container.querySelector("[data-new-event]")?.addEventListener("click", newEvento);
      bindPager(container, "eventos", loadEventos);
    } catch (err) {
      container.innerHTML = emptyState(err.message);
    }
  }

  function eventoCard(evento) {
    const pct = evento.capacidadMaxima ? Math.round((evento.cuposDisponibles / evento.capacidadMaxima) * 100) : 0;
    return `
      <article class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/30 hover:shadow-md transition-all group">
        <div class="h-36 bg-surface-container-highest relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-secondary-container/30 to-tertiary-fixed-dim/30"></div>
          <div class="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-surface-container-lowest/90 text-label-sm font-label-sm">${escapeHtml(evento.categoria?.nombre || "Sin categoria")}</div>
        </div>
        <div class="p-5 flex flex-col gap-4">
          <div class="flex justify-between gap-3">
            <div>
              <h3 class="font-title-md text-title-md text-on-surface">${escapeHtml(evento.nombre)}</h3>
              <p class="text-body-sm text-on-surface-variant line-clamp-2">${escapeHtml(evento.descripcion || "Sin descripcion")}</p>
            </div>
            <div class="flex gap-1">
              <button data-edit-event="${evento.id}" class="text-on-surface-variant hover:text-secondary"><span class="material-symbols-outlined">edit</span></button>
              <button data-delete-event="${evento.id}" class="text-on-surface-variant hover:text-error"><span class="material-symbols-outlined">delete</span></button>
            </div>
          </div>
          <div class="space-y-2 text-body-sm text-on-surface-variant">
            <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">event</span>${dateTime(evento.fechaEvento)}</p>
            <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">location_on</span>${escapeHtml(evento.lugar)}</p>
            <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">payments</span>${money(evento.precioEntrada)}</p>
          </div>
          <div>
            <div class="flex justify-between text-label-sm text-on-surface-variant mb-1"><span>Cupos</span><span>${evento.cuposDisponibles}/${evento.capacidadMaxima}</span></div>
            <div class="h-2 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full bg-secondary" style="width:${Math.max(0, Math.min(100, pct))}%"></div></div>
          </div>
          <span class="w-fit px-3 py-1 rounded-full bg-surface-container text-label-sm">${escapeHtml(evento.estadoEvento || "ACTIVO")}</span>
        </div>
      </article>`;
  }

  function addEventCard() {
    return `<button data-new-event class="border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-8 hover:bg-surface-container-lowest hover:border-secondary group transition-all">
      <span class="material-symbols-outlined text-4xl mb-2">add_circle</span>
      <span class="font-label-md">Nuevo evento</span>
    </button>`;
  }

  async function newEvento() {
    modal("Nuevo evento", await eventoFields(), async (data) => {
      await api("/eventos", { method: "POST", body: JSON.stringify(eventoPayload(data)) });
      notify("Evento creado exitosamente");
      loadEventos();
    });
  }

  async function editEvento(id) {
    const payload = await api(`/eventos/${id}`);
    const value = { ...payload.data, fechaEvento: payload.data.fechaEvento?.slice(0, 16), categoriaId: payload.data.categoria?.id };
    modal("Editar evento", await eventoFields(payload.data), async (data) => {
      await api(`/eventos/${id}`, { method: "PUT", body: JSON.stringify(eventoPayload(data)) });
      notify("Evento actualizado exitosamente");
      loadEventos();
    }, value);
  }

  async function deleteEvento(id) {
    if (!window.confirm("Eliminar este evento?")) return;
    await api(`/eventos/${id}`, { method: "DELETE" });
    notify("Evento eliminado");
    loadEventos();
  }

  function categoriaFields() {
    return [
      { name: "nombre", label: "Nombre", required: true, full: true },
      { name: "descripcion", label: "Descripcion", type: "textarea", full: true },
    ];
  }

  async function loadCategorias() {
    const container = document.querySelector(".bento-grid");
    if (!container) return;
    setBusy(container);
    try {
      const s = state.categorias;
      const payload = await api(`/categorias?${params({ page: s.page, size: s.size, sort: "nombre,asc" })}`);
      const page = pageData(payload);
      s.totalPages = page.totalPages;
      const items = page.content.filter((item) => matchesQuery(item, s.query));
      container.innerHTML = items.length ? items.map(categoriaCard).join("") + pagerHtml(page.number, page.totalPages, page.totalElements) : emptyState("No hay categorias para mostrar.") + pagerHtml(page.number, page.totalPages, page.totalElements);
      container.querySelectorAll("[data-edit-category]").forEach((button) => button.addEventListener("click", () => editCategoria(Number(button.dataset.editCategory))));
      container.querySelectorAll("[data-delete-category]").forEach((button) => button.addEventListener("click", () => deleteCategoria(Number(button.dataset.deleteCategory))));
      bindPager(container, "categorias", loadCategorias);
    } catch (err) {
      container.innerHTML = emptyState(err.message);
    }
  }

  function categoriaCard(categoria) {
    return `
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm card-lift border-l-4 border-secondary flex flex-col gap-4">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-title-lg text-title-lg text-on-surface">${escapeHtml(categoria.nombre)}</h3>
            <p class="text-body-sm text-on-surface-variant mt-1">ID ${escapeHtml(categoria.id)}</p>
          </div>
          <div class="flex">
            <button data-edit-category="${categoria.id}" class="text-secondary hover:bg-secondary/5 p-2 rounded-full transition-all"><span class="material-symbols-outlined">edit</span></button>
            <button data-delete-category="${categoria.id}" class="text-error hover:bg-error-container p-2 rounded-full transition-all"><span class="material-symbols-outlined">delete</span></button>
          </div>
        </div>
        <p class="text-body-md text-on-surface-variant flex-1">${escapeHtml(categoria.descripcion || "Sin descripcion")}</p>
      </div>`;
  }

  function newCategoria() {
    modal("Nueva categoria", categoriaFields(), async (data) => {
      await api("/categorias", { method: "POST", body: JSON.stringify(data) });
      notify("Categoria creada exitosamente");
      loadCategorias();
    });
  }

  async function editCategoria(id) {
    const payload = await api(`/categorias/${id}`);
    modal("Editar categoria", categoriaFields(), async (data) => {
      await api(`/categorias/${id}`, { method: "PUT", body: JSON.stringify(data) });
      notify("Categoria actualizada exitosamente");
      loadCategorias();
    }, payload.data);
  }

  async function deleteCategoria(id) {
    if (!window.confirm("Eliminar esta categoria?")) return;
    await api(`/categorias/${id}`, { method: "DELETE" });
    notify("Categoria eliminada");
    loadCategorias();
  }

  async function reservaFields(values = {}) {
    const [usuarios, eventos] = await Promise.all([all("usuarios"), all("eventos/disponibles")]);
    return [
      { name: "usuarioId", label: "Usuario", type: "select", required: true, options: usuarios.map((u) => ({ value: u.id, label: `${u.nombre} ${u.apellido} - ${u.correo}` })), defaultValue: values.usuario?.id },
      { name: "eventoId", label: "Evento", type: "select", required: true, options: eventos.map((e) => ({ value: e.id, label: `${e.nombre} (${e.cuposDisponibles} cupos)` })), defaultValue: values.evento?.id },
      { name: "cantidadEntradas", label: "Cantidad entradas", type: "number", required: true, defaultValue: 1 },
    ];
  }

  async function loadReservas() {
    const container = document.querySelector(".kanban-container");
    if (!container) return;
    container.innerHTML = `<div class="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center text-on-surface-variant">Cargando reservas...</div>`;
    try {
      const s = state.reservas;
      const payload = await api(`/reservas?${params({ page: s.page, size: s.size, sort: "fechaReserva,desc" })}`);
      const page = pageData(payload);
      s.totalPages = page.totalPages;
      let items = page.content.filter((item) => matchesQuery(item, s.query));
      if (s.estado) items = items.filter((item) => item.estadoReserva === s.estado);
      container.innerHTML = ["CONFIRMADA", "PENDIENTE", "CANCELADA"].map((estado) => reservaColumn(estado, items.filter((item) => item.estadoReserva === estado))).join("") +
        `<button data-new-reservation class="kanban-column h-16 border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center gap-2 text-on-surface-variant hover:border-secondary hover:text-secondary transition-all group"><span class="material-symbols-outlined">add</span>Nueva reserva</button>` +
        `<div class="kanban-column">${pagerHtml(page.number, page.totalPages, page.totalElements)}</div>`;
      container.querySelectorAll("[data-cancel-reservation]").forEach((button) => button.addEventListener("click", () => cancelReserva(Number(button.dataset.cancelReservation))));
      container.querySelector("[data-new-reservation]")?.addEventListener("click", newReserva);
      bindPager(container, "reservas", loadReservas);
    } catch (err) {
      container.innerHTML = `<div class="w-full rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center text-on-surface-variant">${escapeHtml(err.message)}</div>`;
    }
  }

  function reservaColumn(estado, reservas) {
    const labels = { CONFIRMADA: "Confirmadas", PENDIENTE: "Pendientes", CANCELADA: "Canceladas" };
    return `
      <div class="kanban-column flex flex-col gap-4">
        <div class="flex items-center justify-between px-1">
          <h2 class="font-title-md text-title-md text-on-surface">${labels[estado]}</h2>
          <span class="px-2 py-1 rounded-full bg-surface-container-highest text-label-sm">${reservas.length}</span>
        </div>
        ${reservas.length ? reservas.map(reservaCard).join("") : `<div class="bg-surface-container-lowest rounded-xl p-5 border border-dashed border-outline-variant text-on-surface-variant">Sin reservas</div>`}
      </div>`;
  }

  function reservaCard(reserva) {
    return `
      <div class="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 transition-all">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 class="font-title-sm text-title-sm text-on-surface">${escapeHtml(reserva.evento?.nombre || "Evento")}</h3>
            <p class="text-body-sm text-on-surface-variant">Reserva #${escapeHtml(reserva.id)}</p>
          </div>
          ${reserva.estadoReserva !== "CANCELADA" ? `<button data-cancel-reservation="${reserva.id}" class="text-on-surface-variant hover:text-error transition-colors"><span class="material-symbols-outlined">cancel</span></button>` : ""}
        </div>
        <div class="space-y-2 text-body-sm text-on-surface-variant">
          <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">person</span>${escapeHtml(reserva.usuario?.nombre)} ${escapeHtml(reserva.usuario?.apellido)}</p>
          <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">confirmation_number</span>${escapeHtml(reserva.cantidadEntradas)} entradas</p>
          <p class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">schedule</span>${dateTime(reserva.fechaReserva)}</p>
        </div>
      </div>`;
  }

  async function newReserva() {
    modal("Nueva reserva", await reservaFields(), async (data) => {
      await api("/reservas", { method: "POST", body: JSON.stringify({ cantidadEntradas: Number(data.cantidadEntradas), usuarioId: Number(data.usuarioId), eventoId: Number(data.eventoId) }) });
      notify("Reserva creada exitosamente");
      loadReservas();
    });
  }

  async function cancelReserva(id) {
    if (!window.confirm("Cancelar esta reserva?")) return;
    await api(`/reservas/${id}/cancelar`, { method: "PUT" });
    notify("Reserva cancelada");
    loadReservas();
  }

  async function loadDashboard() {
    const cards = document.querySelectorAll(".grid.grid-cols-1.md\\:grid-cols-4 > div");
    if (!cards.length) return;
    try {
      const [usuarios, eventosSummary, eventosFull, reservas] = await Promise.all([
        api("/usuarios?page=0&size=1"),
        api("/eventos?page=0&size=1"),
        api("/eventos?page=0&size=100"),
        api("/reservas?page=0&size=50&sort=fechaReserva,desc"),
      ]);
      const up = pageData(usuarios);
      const ep = pageData(eventosSummary);
      const efp = pageData(eventosFull);
      const rp = pageData(reservas);
      const capacity = efp.content.reduce((sum, event) => sum + Number(event.capacidadMaxima || 0), 0);
      const available = efp.content.reduce((sum, event) => sum + Number(event.cuposDisponibles || 0), 0);
      const occupancy = capacity ? `${Math.round(((capacity - available) / capacity) * 100)}%` : "0%";
      const metrics = [rp.totalElements, up.totalElements, ep.totalElements, occupancy];
      cards.forEach((card, index) => {
        const value = card.querySelector("h3");
        if (value) value.textContent = metrics[index] ?? 0;
      });

      const activity = document.querySelector(".flex-1.overflow-y-auto");
      if (activity) {
        activity.innerHTML = rp.content.slice(0, 8).map((reserva) => `
          <div class="p-2 rounded-lg transition-all hover:bg-surface-variant/20 cursor-pointer">
            <p class="font-body-md text-body-md text-on-surface">${escapeHtml(reserva.usuario?.nombre)} ${escapeHtml(reserva.usuario?.apellido)} reservo ${escapeHtml(reserva.cantidadEntradas)} entrada(s)</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">${escapeHtml(reserva.evento?.nombre || "Evento")} - ${dateTime(reserva.fechaReserva)}</p>
          </div>`).join("") || `<div class="p-2 text-on-surface-variant">Sin actividad reciente</div>`;
      }

      const upcomingGrid = document.querySelector(".grid.grid-cols-1.md\\:grid-cols-2.gap-4");
      if (upcomingGrid) {
        const available = await api("/eventos/disponibles?page=0&size=4&sort=fechaEvento,asc");
        upcomingGrid.innerHTML = pageData(available).content.map((evento) => `
          <div class="bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/50 card-lift">
            <p class="font-label-md text-label-md text-on-surface-variant">${shortDate(evento.fechaEvento)}</p>
            <h3 class="font-title-md text-title-md text-on-surface mt-1">${escapeHtml(evento.nombre)}</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-2">${escapeHtml(evento.lugar)} - ${escapeHtml(evento.cuposDisponibles)} cupos</p>
          </div>`).join("") || emptyState("No hay eventos disponibles.");
      }
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function buildCategoryFilters() {
    const bar = document.querySelector(".overflow-x-auto");
    if (!bar || !location.pathname.includes("eventos")) return;
    try {
      const categorias = await all("categorias");
      bar.innerHTML = `<button data-category-filter="" class="px-4 py-1.5 rounded-full bg-secondary text-on-secondary font-label-md text-label-md whitespace-nowrap">All Events</button>` +
        categorias.map((categoria) => `<button data-category-filter="${categoria.id}" class="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors font-label-md text-label-md whitespace-nowrap">${escapeHtml(categoria.nombre)}</button>`).join("");
      bar.querySelectorAll("[data-category-filter]").forEach((button) => button.addEventListener("click", () => {
        state.eventos.categoriaId = button.dataset.categoryFilter;
        state.eventos.page = 0;
        bar.querySelectorAll("button").forEach((b) => {
          b.classList.remove("bg-secondary", "text-on-secondary");
          b.classList.add("bg-surface-container-high");
        });
        button.classList.add("bg-secondary", "text-on-secondary");
        button.classList.remove("bg-surface-container-high");
        loadEventos();
      }));
    } catch (err) {
      notify(err.message, "error");
    }
  }

  function wirePrimaryActions() {
    const bodyText = document.body.textContent;
    document.querySelectorAll("button").forEach((button) => {
      if (button.closest("aside")) return;
      const text = button.textContent.trim().toLowerCase();
      if (text.includes("new user") || text.includes("nuevo usuario") || text.includes("add user")) button.addEventListener("click", newUsuario);
      if (text.includes("new event") || text.includes("nuevo evento") || text.includes("create event")) button.addEventListener("click", newEvento);
      if (text.includes("new categor") || text.includes("nueva categor")) button.addEventListener("click", newCategoria);
      if (text.includes("new reservation") || text.includes("nueva reserva")) button.addEventListener("click", newReserva);
    });
    if (bodyText.includes("Category Management")) document.querySelector("main button.bg-secondary")?.addEventListener("click", newCategoria);
  }

  function wireReservationFilters() {
    if (!location.pathname.includes("reservas")) return;
    const labels = { todos: "", confirmados: "CONFIRMADA", pendientes: "PENDIENTE", "en espera": "PENDIENTE" };
    document.querySelectorAll(".bg-surface-container button").forEach((button) => {
      button.addEventListener("click", () => {
        state.reservas.estado = labels[button.textContent.trim().toLowerCase()] ?? "";
        state.reservas.page = 0;
        loadReservas();
      });
    });
  }

  function init() {
    wireNavigation();
    wirePrimaryActions();
    const path = location.pathname.toLowerCase();
    if (path.includes("analytics") || path.includes("report")) {
      return;
    }
    if (path.includes("usuarios")) {
      bindSearch("usuarios", loadUsuarios);
      loadUsuarios();
    } else if (path.includes("eventos")) {
      bindSearch("eventos", loadEventos);
      buildCategoryFilters();
      loadEventos();
    } else if (path.includes("categorias")) {
      bindSearch("categorias", loadCategorias);
      loadCategorias();
    } else if (path.includes("reservas")) {
      bindSearch("reservas", loadReservas);
      wireReservationFilters();
      loadReservas();
    } else {
      loadDashboard();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
