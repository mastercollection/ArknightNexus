use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("지원하지 않는 지역 코드입니다.")]
    InvalidRegion,
    #[error("원격 데이터를 내려받지 못했습니다.")]
    Network(#[from] reqwest::Error),
    #[error("{context} 파싱 실패: {path} ({message})")]
    Parse {
        context: String,
        path: String,
        message: String,
    },
    #[error("{context} 직렬화 실패: {message}")]
    Serde { context: String, message: String },
    #[error("앱 데이터 디렉터리를 찾지 못했습니다.")]
    AppDataDirUnavailable,
    #[error("로컬 캐시를 읽거나 쓸 수 없습니다.")]
    Io(#[from] std::io::Error),
    #[error("아직 동기화된 데이터가 없습니다.")]
    SnapshotMissing,
}
