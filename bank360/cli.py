"""BANK 360 command-line interface, compatible with Windows PowerShell."""
import argparse
import json
from pathlib import Path
from .pipeline import ROOT, DataQualityError, build, download_dataset, validate_database


def main(argv=None):
    parser = argparse.ArgumentParser(prog='bank360', description='BANK 360 B1 historical credit data ingestion')
    sub = parser.add_subparsers(dest='command', required=True)
    get = sub.add_parser('download', help='Retrieve the official UCI ZIP, or an explicitly requested CSV mirror')
    get.add_argument('--source', choices=['official','mirror'], default='official')
    get.add_argument('--force', action='store_true')
    automatic = sub.add_parser('run', help='One-command download + verified build from UCI (network required)')
    automatic.add_argument('--source', choices=['official','mirror'], default='official')
    automatic.add_argument('--force', action='store_true')
    automatic.add_argument('--output-dir', type=Path, default=ROOT)
    run = sub.add_parser('build', help='Validate and load historical UCI data; export SQL/CSV results')
    run.add_argument('--input', required=True, type=Path)
    run.add_argument('--origin', choices=['official','mirror','local-unknown','synthetic-test'], default='local-unknown')
    run.add_argument('--output-dir', type=Path, default=ROOT)
    run.add_argument('--demo', action='store_true', help='Explicitly mark the input as synthetic')
    run.add_argument('--expected-rows', type=int, default=30000)
    audit = sub.add_parser('validate', help='Execute SQL integrity checks on an existing database')
    audit.add_argument('--db', type=Path, default=ROOT / 'data' / 'bank360.sqlite')
    try:
        if args := parser.parse_args(argv):
            if args.command == 'download':
                result = download_dataset(source=args.source, force=args.force)
                print(f'Downloaded/cached {result}')
            elif args.command == 'run':
                src_path = download_dataset(source=args.source, force=args.force)
                report = build(src_path, output_dir=args.output_dir, origin=args.source)
                print(json.dumps({'status':report['status'], 'dataset_kind':report['dataset_kind'],
                                  'metrics':report['metrics'], 'checks':report['integrity_checks']},
                                 ensure_ascii=False, indent=2))
            elif args.command == 'build':
                report = build(args.input, output_dir=args.output_dir, demo=args.demo,
                               expected_rows=args.expected_rows, origin=args.origin)
                print(json.dumps({'status':report['status'], 'dataset_kind':report['dataset_kind'],
                                  'metrics':report['metrics'], 'checks':report['integrity_checks']},
                                 ensure_ascii=False, indent=2))
            else:
                print(json.dumps(validate_database(args.db), ensure_ascii=False, indent=2))
    except (DataQualityError, RuntimeError, FileNotFoundError, OSError) as exc:
        parser.exit(2, f'B1 ERROR: {exc}\n')
