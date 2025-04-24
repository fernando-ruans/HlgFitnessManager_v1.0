import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, getCategoryLabel, getStatusLabel } from "@/lib/utils";
import { Sale, Product, Customer } from "@shared/schema";

// Configure PDF with default settings
const configureDocument = (doc: jsPDF, title: string) => {
  // Add metadata
  doc.setProperties({
    title: title,
    subject: "HLG Fitness",
    author: "HLG Fitness App",
    keywords: "relatório, vendas, estoque, fitness",
    creator: "HLG Fitness App",
  });

  // Set font
  doc.setFont("helvetica");
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(45, 49, 66); // primary color
  doc.text("HLG FITNESS", 14, 15);
  
  doc.setFontSize(12);
  doc.setTextColor(79, 93, 117); // primary-light color
  doc.text(title, 14, 22);
  
  // Add logo (base64 encoded SVG)
  const logoSvg = document.getElementById("hlg-logo-svg");
  if (logoSvg) {
    const svgData = new XMLSerializer().serializeToString(logoSvg);
    const canvas = document.createElement("canvas");
    canvas.width = 30;
    canvas.height = 30;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 30, 30);
        const dataUrl = canvas.toDataURL("image/png");
        doc.addImage(dataUrl, "PNG", 180, 10, 15, 15);
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  }
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "PPP 'às' HH:mm", { locale: ptBR })}`, 14, 30);
  
  // Add divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, 196, 35);
};

export const generateSalesReport = async (
  sales: Sale[],
  startDate: Date,
  endDate: Date,
): Promise<string> => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Configure document
  const title = `Relatório de Vendas - ${format(startDate, "P", { locale: ptBR })} até ${format(endDate, "P", { locale: ptBR })}`;
  configureDocument(doc, title);
  
  // If no sales, show empty message
  if (sales.length === 0) {
    doc.setFontSize(12);
    doc.text("Nenhuma venda encontrada no período selecionado.", 14, 50);
  } else {
    // Add sales summary
    doc.setFontSize(12);
    doc.setTextColor(45, 49, 66);
    doc.text("Resumo de Vendas", 14, 45);
    
    // Calculate totals
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    const completed = sales.filter(sale => sale.status === "completed");
    const pending = sales.filter(sale => sale.status === "pending");
    const cancelled = sales.filter(sale => sale.status === "cancelled");
    
    const totalCompleted = completed.reduce((sum, sale) => sum + sale.total, 0);
    
    doc.setFontSize(10);
    doc.text(`Total de vendas: ${sales.length}`, 14, 55);
    doc.text(`Valor total: ${formatCurrency(total)}`, 14, 60);
    doc.text(`Vendas concluídas: ${completed.length} (${formatCurrency(totalCompleted)})`, 14, 65);
    doc.text(`Vendas pendentes: ${pending.length}`, 14, 70);
    doc.text(`Vendas canceladas: ${cancelled.length}`, 14, 75);
    
    // Add sales table
    doc.setFontSize(12);
    doc.text("Detalhamento de Vendas", 14, 85);
    
    const salesData = sales.map(sale => [
      sale.id.toString(),
      format(new Date(sale.date), "P", { locale: ptBR }),
      sale.customerId.toString(), // Ideally this would be customer name
      formatCurrency(sale.total),
      getStatusLabel(sale.status)
    ]);
    
    autoTable(doc, {
      startY: 90,
      head: [['ID', 'Data', 'Cliente', 'Valor', 'Status']],
      body: salesData,
      theme: 'striped',
      headStyles: {
        fillColor: [45, 49, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9
      },
      margin: { left: 14, right: 14 }
    });
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`HLG Fitness - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }
  
  // Generate filename
  const filename = `relatorio_vendas_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`;
  
  // Save PDF
  doc.save(filename);
  
  return filename;
};

export const generateInventoryReport = async (products: Product[]): Promise<string> => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Configure document
  const title = `Relatório de Estoque - ${format(new Date(), "P", { locale: ptBR })}`;
  configureDocument(doc, title);
  
  // If no products, show empty message
  if (products.length === 0) {
    doc.setFontSize(12);
    doc.text("Nenhum produto encontrado no estoque.", 14, 50);
  } else {
    // Add inventory summary
    doc.setFontSize(12);
    doc.setTextColor(45, 49, 66);
    doc.text("Resumo de Estoque", 14, 45);
    
    // Calculate totals
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const totalLowStock = products.filter(product => product.stock <= product.minStock).length;
    const totalOutOfStock = products.filter(product => product.stock === 0).length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    
    doc.setFontSize(10);
    doc.text(`Total de produtos: ${totalProducts}`, 14, 55);
    doc.text(`Quantidade total em estoque: ${totalStock} unidades`, 14, 60);
    doc.text(`Produtos com estoque baixo: ${totalLowStock}`, 14, 65);
    doc.text(`Produtos sem estoque: ${totalOutOfStock}`, 14, 70);
    doc.text(`Valor total do estoque: ${formatCurrency(totalValue)}`, 14, 75);
    
    // Add products table
    doc.setFontSize(12);
    doc.text("Detalhamento de Produtos", 14, 85);
    
    // Create three tables: low stock, normal stock, and out of stock
    const lowStockProducts = products.filter(product => product.stock <= product.minStock && product.stock > 0);
    const outOfStockProducts = products.filter(product => product.stock === 0);
    const normalStockProducts = products.filter(product => product.stock > product.minStock);
    
    let currentY = 90;
    
    // Low stock products
    if (lowStockProducts.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(231, 76, 60); // danger color
      doc.text("Produtos com Estoque Baixo", 14, currentY);
      
      const lowStockData = lowStockProducts.map(product => [
        product.id.toString(),
        product.name,
        `${product.size} - ${product.color}`,
        getCategoryLabel(product.category),
        product.stock.toString(),
        product.minStock.toString(),
        formatCurrency(product.price),
        formatCurrency(product.price * product.stock)
      ]);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['ID', 'Nome', 'Tamanho/Cor', 'Categoria', 'Estoque', 'Mín.', 'Preço Unit.', 'Valor Total']],
        body: lowStockData,
        theme: 'striped',
        headStyles: {
          fillColor: [231, 76, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8
        },
        margin: { left: 14, right: 14 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Out of stock products
    if (outOfStockProducts.length > 0) {
      // Check if we need a new page
      if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(243, 156, 18); // warning color
      doc.text("Produtos Sem Estoque", 14, currentY);
      
      const outOfStockData = outOfStockProducts.map(product => [
        product.id.toString(),
        product.name,
        `${product.size} - ${product.color}`,
        getCategoryLabel(product.category),
        product.stock.toString(),
        product.minStock.toString(),
        formatCurrency(product.price),
        formatCurrency(0)
      ]);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['ID', 'Nome', 'Tamanho/Cor', 'Categoria', 'Estoque', 'Mín.', 'Preço Unit.', 'Valor Total']],
        body: outOfStockData,
        theme: 'striped',
        headStyles: {
          fillColor: [243, 156, 18],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8
        },
        margin: { left: 14, right: 14 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Normal stock products
    if (normalStockProducts.length > 0) {
      // Check if we need a new page
      if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(10);
      doc.setTextColor(46, 204, 113); // success color
      doc.text("Produtos com Estoque Normal", 14, currentY);
      
      const normalStockData = normalStockProducts.map(product => [
        product.id.toString(),
        product.name,
        `${product.size} - ${product.color}`,
        getCategoryLabel(product.category),
        product.stock.toString(),
        product.minStock.toString(),
        formatCurrency(product.price),
        formatCurrency(product.price * product.stock)
      ]);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['ID', 'Nome', 'Tamanho/Cor', 'Categoria', 'Estoque', 'Mín.', 'Preço Unit.', 'Valor Total']],
        body: normalStockData,
        theme: 'striped',
        headStyles: {
          fillColor: [46, 204, 113],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8
        },
        margin: { left: 14, right: 14 }
      });
    }
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`HLG Fitness - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }
  
  // Generate filename
  const filename = `relatorio_estoque_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`;
  
  // Save PDF
  doc.save(filename);
  
  return filename;
};
