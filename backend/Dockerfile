# syntax=docker/dockerfile:1

# ============================================================
# BUILD STAGE
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy complete backend source
COPY . .

# Restore dependencies
RUN dotnet restore ./src/BookKaroo.Api/BookKaroo.Api.csproj

# Build and publish
RUN dotnet publish \
    ./src/BookKaroo.Api/BookKaroo.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore


# ============================================================
# RUNTIME STAGE
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

# Install Kerberos/GSSAPI runtime library
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:5000

EXPOSE 5000

# Copy published application
COPY --from=build /app/publish .

# Start ASP.NET Core application
ENTRYPOINT ["dotnet", "BookKaroo.Api.dll"]
