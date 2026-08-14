using BookKaroo.Application.DTOs.Invoice;

namespace BookKaroo.Application.Interfaces.Services;

public interface IInvoicePdfGenerator
{
    byte[] Generate(InvoiceModel model);
}
